(function e(t, n, r) {
	function s(o, u) {
		if (!n[o]) {
			if (!t[o]) {
				var a = typeof require == "function" && require;
				if (!u && a)return a(o, !0);
				if (i)return i(o, !0);
				var f = new Error("Cannot find module '" + o + "'");
				throw f.code = "MODULE_NOT_FOUND", f
			}
			var l = n[o] = {exports: {}};
			t[o][0].call(l.exports, function (e) {
				var n = t[o][1][e];
				return s(n ? n : e)
			}, l, l.exports, e, t, n, r)
		}
		return n[o].exports
	}

	var i = typeof require == "function" && require;
	for (var o = 0; o < r.length; o++)s(r[o]);
	return s
})({
	1: [function (require, module, exports) {
		require('pomelo-cocos2d-js')
	}, {"pomelo-cocos2d-js": 2}],
	2: [function (require, module, exports) {
		var Util = require('util');

		function checkCocos2dJsb() {
			if (typeof cc !== 'undefined' && cc && cc.sys && cc.sys.isNative) {
				return true;
			}

			return false;
		}

		var Root;
		(function () {
			Root = this;
		}());

		if (checkCocos2dJsb()) {
			var console = cc;
			Root.console = console;
			cc.formatStr = Util.format;
		}

		var EventEmitter = require('events').EventEmitter;
		Root.EventEmitter = EventEmitter;
		var protobuf = require('pomelo-protobuf');
		Root.protobuf = protobuf;
		var Protocol = require('pomelo-protocol');
		Root.Protocol = Protocol;
		var PP = require('pomelo-jsclient-websocket');

		Root.PP = PP;

	}, {"events": 17, "pomelo-jsclient-websocket": 3, "pomelo-protobuf": 9, "pomelo-protocol": 11, "util": 21}],
	3: [function (require, module, exports) {
		(function () {

			const that = this

			function PP() {

                var JS_WS_CLIENT_TYPE = 'js-websocket';
                var JS_WS_CLIENT_VERSION = '0.0.1';

                var Protocol = that.Protocol;
                var protobuf = that.protobuf;
                var decodeIO_protobuf = that.decodeIO_protobuf;
                var decodeIO_encoder = null;
                var decodeIO_decoder = null;
                var Package = Protocol.Package;
                var Message = Protocol.Message;
                var EventEmitter = require('events')
                var rsa = that.rsa;

                if (typeof(window) != "undefined" && typeof(sys) != 'undefined' && sys.localStorage) {
                    window.localStorage = sys.localStorage;
                }

                var RES_OK = 200;
                var RES_FAIL = 500;
                var RES_OLD_CLIENT = 501;

                if (typeof Object.create !== 'function') {
                    Object.create = function (o) {
                        function F() {
                        }

                        F.prototype = o;
                        return new F();
                    };
                }

                // var root = this;
                this.pomelo = Object.create(EventEmitter.prototype); // object extend from object
                // root.pomelo = pomelo;
                var socket = null;
                var reqId = 0;
                var callbacks = {};
                var handlers = {};
                //Map from request id to route
                var routeMap = {};
                var dict = {};    // route string to code
                var abbrs = {};   // code to route string
                var serverProtos = {};
                var clientProtos = {};
                var protoVersion = 0;

                var heartbeatInterval = 0;
                var heartbeatTimeout = 0;
                var nextHeartbeatTimeout = 0;
                var gapThreshold = 100;   // heartbeat gap threashold
                var heartbeatId = null;
                var heartbeatTimeoutId = null;
                var handshakeCallback = null;

                var decode = null;
                var encode = null;

                var reconnect = false;
                var reconncetTimer = null;
                var reconnectUrl = null;
                var reconnectAttempts = 0;
                var reconnectionDelay = 5000;
                var DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;

                var useCrypto;

                var handshakeBuffer = {
                    'sys': {
                        type: JS_WS_CLIENT_TYPE,
                        version: JS_WS_CLIENT_VERSION,
                        rsa: {}
                    },
                    'user': {}
                };

                var initCallback = null;

                this.pomelo.init = function (params, cb) {
                    initCallback = cb;
                    var host = params.host;
                    var port = params.port;

                    encode = params.encode || defaultEncode;
                    decode = params.decode || defaultDecode;

                    var url = 'ws://' + host;
                    if (port) {
                        url += ':' + port;
                    }

                    handshakeBuffer.user = params.user;
                    if (params.encrypt) {
                        useCrypto = true;
                        rsa.generate(1024, "10001");
                        var data = {
                            rsa_n: rsa.n.toString(16),
                            rsa_e: rsa.e
                        };
                        handshakeBuffer.sys.rsa = data;
                    }
                    handshakeCallback = params.handshakeCallback;
                    connect(params, url, cb);
                };

                var defaultDecode = this.pomelo.decode = function (data) {
                    //probuff decode
                    var msg = Message.decode(data);

                    if (msg.id > 0) {
                        msg.route = routeMap[msg.id];
                        delete routeMap[msg.id];
                        if (!msg.route) {
                            return;
                        }
                    }

                    msg.body = deCompose(msg);
                    return msg;
                };

                var defaultEncode = this.pomelo.encode = function (reqId, route, msg) {
                    var type = reqId ? Message.TYPE_REQUEST : Message.TYPE_NOTIFY;

                    //compress message by protobuf
                    if (protobuf && clientProtos[route]) {
                        msg = protobuf.encode(route, msg);
                    } else if (decodeIO_encoder && decodeIO_encoder.lookup(route)) {
                        var Builder = decodeIO_encoder.build(route);
                        msg = new Builder(msg).encodeNB();
                    } else {
                        msg = Protocol.strencode(JSON.stringify(msg));
                    }

                    var compressRoute = 0;
                    if (dict && dict[route]) {
                        route = dict[route];
                        compressRoute = 1;
                    }

                    return Message.encode(reqId, type, compressRoute, route, msg);
                };

                var connect = function (params, url, cb) {
                    console.log('connect to ' + url);

                    var params = params || {};
                    var maxReconnectAttempts = params.maxReconnectAttempts || DEFAULT_MAX_RECONNECT_ATTEMPTS;
                    reconnectUrl = url;
                    //Add protobuf version
                    if (this.localStorage && this.localStorage.getItem('protos') && protoVersion === 0) {
                        var protos = JSON.parse(this.localStorage.getItem('protos'));

                        protoVersion = protos.version || 0;
                        serverProtos = protos.server || {};
                        clientProtos = protos.client || {};

                        if (!!protobuf) {
                            protobuf.init({encoderProtos: clientProtos, decoderProtos: serverProtos});
                        }
                        if (!!decodeIO_protobuf) {
                            decodeIO_encoder = decodeIO_protobuf.loadJson(clientProtos);
                            decodeIO_decoder = decodeIO_protobuf.loadJson(serverProtos);
                        }
                    }
                    //Set protoversion
                    handshakeBuffer.sys.protoVersion = protoVersion;

                    var onopen = function (event) {

                        console.log('connect success')

                        if (!!reconnect) {
                            this.pomelo.emit('reconnect');
                        }
                        reset();
                        var obj = Package.encode(Package.TYPE_HANDSHAKE, Protocol.strencode(JSON.stringify(handshakeBuffer)));
                        send(obj);
                    };
                    var onmessage = function (event) {
                        processPackage(Package.decode(event.data), cb);
                        // new package arrived, update the heartbeat timeout
                        if (heartbeatTimeout) {
                            nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
                        }
                    };
                    var onerror = function (event) {
                        this.pomelo.emit('io-error', event);
                        console.error('socket error: ', event);
                    };

                    var onclose = function (event) {
                    	// console.log(asdfasd)
                        // this.pomelo.emit('close', event);
                        // this.pomelo.emit('disconnect', event);
                        // console.error('socket close: ', event);
                        if (!!params.reconnect && reconnectAttempts < maxReconnectAttempts) {
                            reconnect = true;
                            reconnectAttempts++;
                            reconncetTimer = setTimeout(function () {
                                connect(params, reconnectUrl, cb);
                            }, reconnectionDelay);
                            reconnectionDelay *= 2;
                        }
                    };
                    const WebSocket = require('ws')
                    socket = new WebSocket(url);
                    socket.binaryType = 'arraybuffer';
                    socket.onopen = onopen;
                    socket.onmessage = onmessage;
                    socket.onerror = onerror;
                    socket.onclose = onclose;
                };

                this.pomelo.disconnect = function () {
                    if (socket) {
                        if (socket.disconnect) socket.disconnect();
                        if (socket.close) socket.close();
                        console.log('disconnect');
                        socket = null;
                    }

                    if (heartbeatId) {
                        clearTimeout(heartbeatId);
                        heartbeatId = null;
                    }
                    if (heartbeatTimeoutId) {
                        clearTimeout(heartbeatTimeoutId);
                        heartbeatTimeoutId = null;
                    }
                };

                var reset = function () {
                    reconnect = false;
                    reconnectionDelay = 1000 * 5;
                    reconnectAttempts = 0;
                    clearTimeout(reconncetTimer);
                };

                this.pomelo.request = function (route, msg, cb) {
                    if (arguments.length === 2 && typeof msg === 'function') {
                        cb = msg;
                        msg = {};
                    } else {
                        msg = msg || {};
                    }
                    route = route || msg.route;
                    if (!route) {
                        return;
                    }

                    reqId++;
                    // console.log(route)
                    sendMessage(reqId, route, msg);

                    callbacks[reqId] = cb;
                    routeMap[reqId] = route;
                };

                this.pomelo.notify = function (route, msg) {
                    msg = msg || {};
                    sendMessage(0, route, msg);
                };

                var sendMessage = function (reqId, route, msg) {
                    if (useCrypto) {
                        msg = JSON.stringify(msg);
                        var sig = rsa.signString(msg, "sha256");
                        msg = JSON.parse(msg);
                        msg['__crypto__'] = sig;
                    }

                    if (encode) {
                        msg = encode(reqId, route, msg);
                    }

                    var packet = Package.encode(Package.TYPE_DATA, msg);
                    send(packet);
                };

                var send = function (packet) {
                    if (socket)
                        socket.send(packet.buffer);
                };

                var handler = {};

                var heartbeat = function (data) {
                    if (!heartbeatInterval) {
                        // no heartbeat
                        return;
                    }

                    var obj = Package.encode(Package.TYPE_HEARTBEAT);
                    if (heartbeatTimeoutId) {
                        clearTimeout(heartbeatTimeoutId);
                        heartbeatTimeoutId = null;
                    }

                    if (heartbeatId) {
                        // already in a heartbeat interval
                        return;
                    }
                    heartbeatId = setTimeout(function () {
                        heartbeatId = null;
                        send(obj);

                        nextHeartbeatTimeout = Date.now() + heartbeatTimeout;
                        heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, heartbeatTimeout);
                    }, heartbeatInterval);
                };

                var heartbeatTimeoutCb = function () {
                    var gap = nextHeartbeatTimeout - Date.now();
                    if (gap > gapThreshold) {
                        heartbeatTimeoutId = setTimeout(heartbeatTimeoutCb, gap);
                    } else {
                        console.error('server heartbeat timeout');
                        this.pomelo.emit('heartbeat timeout');
                        this.pomelo.disconnect();
                    }
                };

                var handshake = function (data) {
                    data = JSON.parse(Protocol.strdecode(data));
                    if (data.code === RES_OLD_CLIENT) {
                        this.pomelo.emit('error', 'client version not fullfill');
                        return;
                    }

                    if (data.code !== RES_OK) {
                        this.pomelo.emit('error', 'handshake fail');
                        return;
                    }

                    handshakeInit(data);

                    var obj = Package.encode(Package.TYPE_HANDSHAKE_ACK);
                    send(obj);
                    if (initCallback) {
                        initCallback(socket);
                    }
                };

                var onData = function (data) {
                    var msg = data;
                    if (decode) {
                        msg = decode(msg);
                    }
                    processMessage(this.pomelo, msg);
                };

                var onKick = function (data) {
                    data = JSON.parse(Protocol.strdecode(data));
                    this.pomelo.emit('onKick', data);
                };

                handlers[Package.TYPE_HANDSHAKE] = handshake;
                handlers[Package.TYPE_HEARTBEAT] = heartbeat;
                handlers[Package.TYPE_DATA] = onData;
                handlers[Package.TYPE_KICK] = onKick;

                var processPackage = function (msgs) {
                    if (Array.isArray(msgs)) {
                        for (var i = 0; i < msgs.length; i++) {
                            var msg = msgs[i];
                            handlers[msg.type](msg.body);
                        }
                    } else {
                        handlers[msgs.type](msgs.body);
                    }
                };

                var processMessage = function (pomelo, msg) {
                    if (!msg.id) {
                        // server push message
                        this.pomelo.emit(msg.route, msg.body);
                        return;
                    }

                    //if have a id then find the callback function with the request
                    var cb = callbacks[msg.id];

                    delete callbacks[msg.id];
                    if (typeof cb !== 'function') {
                        return;
                    }

                    cb(msg.body);

                };

                var processMessageBatch = function (pomelo, msgs) {
                    for (var i = 0, l = msgs.length; i < l; i++) {
                        processMessage(pomelo, msgs[i]);
                    }
                };

                var deCompose = function (msg) {
                    var route = msg.route;

                    //Decompose route from dict
                    if (msg.compressRoute) {
                        if (!abbrs[route]) {
                            return {};
                        }

                        route = msg.route = abbrs[route];
                    }
                    if (protobuf && serverProtos[route]) {
                        return protobuf.decodeStr(route, msg.body);
                    } else if (decodeIO_decoder && decodeIO_decoder.lookup(route)) {
                        return decodeIO_decoder.build(route).decode(msg.body);
                    } else {
                        return JSON.parse(Protocol.strdecode(msg.body));
                    }

                    return msg;
                };

                var handshakeInit = function (data) {
                    if (data.sys && data.sys.heartbeat) {
                        heartbeatInterval = data.sys.heartbeat * 1000;   // heartbeat interval
                        heartbeatTimeout = heartbeatInterval * 2;        // max heartbeat timeout
                    } else {
                        heartbeatInterval = 0;
                        heartbeatTimeout = 0;
                    }

                    initData(data);

                    if (typeof handshakeCallback === 'function') {
                        handshakeCallback(data.user);
                    }
                };

                //Initilize data used in pomelo client
                var initData = function (data) {
                    if (!data || !data.sys) {
                        return;
                    }
                    dict = data.sys.dict;
                    var protos = data.sys.protos;

                    //Init compress dict
                    if (dict) {
                        dict = dict;
                        abbrs = {};

                        for (var route in dict) {
                            abbrs[dict[route]] = route;
                        }
                    }

                    //Init protobuf protos
                    if (protos) {
                        protoVersion = protos.version || 0;
                        serverProtos = protos.server || {};
                        clientProtos = protos.client || {};

                        //Save protobuf protos to localStorage
                        // this.localStorage.setItem('protos', JSON.stringify(protos));

                        if (!!protobuf) {
                            protobuf.init({encoderProtos: protos.client, decoderProtos: protos.server});
                        }
                        if (!!decodeIO_protobuf) {
                            decodeIO_encoder = decodeIO_protobuf.loadJson(clientProtos);
                            decodeIO_decoder = decodeIO_protobuf.loadJson(serverProtos);
                        }
                    }
                };
            }

			module.exports = PP

		})();

	}, {}],
	4: [function (require, module, exports) {
		var Encoder = module.exports;

		/**
		 * [encode an uInt32, return a array of bytes]
		 * @param  {[integer]} num
		 * @return {[array]}
		 */
		Encoder.encodeUInt32 = function (num) {
			var n = parseInt(num);
			if (isNaN(n) || n < 0) {
				console.log(n);
				return null;
			}

			var result = [];
			do {
				var tmp = n % 128;
				var next = Math.floor(n / 128);

				if (next !== 0) {
					tmp = tmp + 128;
				}
				result.push(tmp);
				n = next;
			} while (n !== 0);

			return result;
		};

		/**
		 * [encode a sInt32, return a byte array]
		 * @param  {[sInt32]} num  The sInt32 need to encode
		 * @return {[array]} A byte array represent the integer
		 */
		Encoder.encodeSInt32 = function (num) {
			var n = parseInt(num);
			if (isNaN(n)) {
				return null;
			}
			n = n < 0 ? (Math.abs(n) * 2 - 1) : n * 2;

			return Encoder.encodeUInt32(n);
		};

		Encoder.decodeUInt32 = function (bytes) {
			var n = 0;

			for (var i = 0; i < bytes.length; i++) {
				var m = parseInt(bytes[i]);
				n = n + ((m & 0x7f) * Math.pow(2, (7 * i)));
				if (m < 128) {
					return n;
				}
			}

			return n;
		};

		Encoder.decodeSInt32 = function (bytes) {
			var n = this.decodeUInt32(bytes);
			var flag = ((n % 2) === 1) ? -1 : 1;

			n = ((n % 2 + n) / 2) * flag;

			return n;
		};

	}, {}],
	5: [function (require, module, exports) {
		module.exports = {
			TYPES: {
				uInt32: 0,
				sInt32: 0,
				int32: 0,
				double: 1,
				string: 2,
				message: 2,
				float: 5
			}
		}
	}, {}],
	6: [function (require, module, exports) {
		var codec = require('./codec');
		var util = require('./util');

		var Decoder = module.exports;

		var buffer;
		var offset = 0;

		Decoder.init = function (protos) {
			this.protos = protos || {};
		};

		Decoder.setProtos = function (protos) {
			if (!!protos) {
				this.protos = protos;
			}
		};

		Decoder.decode = function (route, buf) {
			var protos = this.protos[route];

			buffer = buf;
			offset = 0;

			if (!!protos) {
				return decodeMsg({}, protos, buffer.length);
			}

			return null;
		};

		function decodeMsg(msg, protos, length) {
			while (offset < length) {
				var head = getHead();
				var type = head.type;
				var tag = head.tag;
				var name = protos.__tags[tag];

				switch (protos[name].option) {
					case 'optional' :
					case 'required' :
						msg[name] = decodeProp(protos[name].type, protos);
						break;
					case 'repeated' :
						if (!msg[name]) {
							msg[name] = [];
						}
						decodeArray(msg[name], protos[name].type, protos);
						break;
				}
			}

			return msg;
		}

		/**
		 * Test if the given msg is finished
		 */
		function isFinish(msg, protos) {
			return (!protos.__tags[peekHead().tag]);
		}

		/**
		 * Get property head from protobuf
		 */
		function getHead() {
			var tag = codec.decodeUInt32(getBytes());

			return {
				type: tag & 0x7,
				tag: tag >> 3
			};
		}

		/**
		 * Get tag head without move the offset
		 */
		function peekHead() {
			var tag = codec.decodeUInt32(peekBytes());

			return {
				type: tag & 0x7,
				tag: tag >> 3
			};
		}

		function decodeProp(type, protos) {
			switch (type) {
				case 'uInt32':
					return codec.decodeUInt32(getBytes());
				case 'int32' :
				case 'sInt32' :
					return codec.decodeSInt32(getBytes());
				case 'float' :
					var float = buffer.readFloatLE(offset);
					offset += 4;
					return float;
				case 'double' :
					var double = buffer.readDoubleLE(offset);
					offset += 8;
					return double;
				case 'string' :
					var length = codec.decodeUInt32(getBytes());

					var str = buffer.toString('utf8', offset, offset + length);
					offset += length;

					return str;
				default :
					var message = protos && (protos.__messages[type] || Decoder.protos['message ' + type]);
					if (message) {
						var length = codec.decodeUInt32(getBytes());
						var msg = {};
						decodeMsg(msg, message, offset + length);
						return msg;
					}
					break;
			}
		}

		function decodeArray(array, type, protos) {
			if (util.isSimpleType(type)) {
				var length = codec.decodeUInt32(getBytes());

				for (var i = 0; i < length; i++) {
					array.push(decodeProp(type));
				}
			} else {
				array.push(decodeProp(type, protos));
			}
		}

		function getBytes(flag) {
			var bytes = [];
			var pos = offset;
			flag = flag || false;

			var b;
			do {
				var b = buffer.readUInt8(pos);
				bytes.push(b);
				pos++;
			} while (b >= 128);

			if (!flag) {
				offset = pos;
			}
			return bytes;
		}

		function peekBytes() {
			return getBytes(true);
		}
	}, {"./codec": 4, "./util": 10}],
	7: [function (require, module, exports) {
		(function (Buffer) {
			var codec = require('./codec');
			var constant = require('./constant');
			var util = require('./util');

			var Encoder = module.exports;

			Encoder.init = function (protos) {
				this.protos = protos || {};
			};

			Encoder.encode = function (route, msg) {
				if (!route || !msg) {
					console.warn('Route or msg can not be null! route : %j, msg %j', route, msg);
					return null;
				}

				//Get protos from protos map use the route as key
				var protos = this.protos[route];

				//Check msg
				if (!checkMsg(msg, protos)) {
					console.warn('check msg failed! msg : %j, proto : %j', msg, protos);
					return null;
				}

				//Set the length of the buffer 2 times bigger to prevent overflow
				var length = Buffer.byteLength(JSON.stringify(msg)) * 2;

				//Init buffer and offset
				var buffer = new Buffer(length);
				var offset = 0;

				if (!!protos) {
					offset = encodeMsg(buffer, offset, protos, msg);
					if (offset > 0) {
						return buffer.slice(0, offset);
					}
				}

				return null;
			};

			/**
			 * Check if the msg follow the defination in the protos
			 */
			function checkMsg(msg, protos) {
				if (!protos || !msg) {
					console.warn('no protos or msg exist! msg : %j, protos : %j', msg, protos);
					return false;
				}

				for (var name in protos) {
					var proto = protos[name];

					//All required element must exist
					switch (proto.option) {
						case 'required' :
							if (typeof(msg[name]) === 'undefined') {
								console.warn('no property exist for required! name: %j, proto: %j, msg: %j', name, proto, msg);
								return false;
							}
						case 'optional' :
							if (typeof(msg[name]) !== 'undefined') {
								var message = protos.__messages[proto.type] || Encoder.protos['message ' + proto.type];
								if (!!message && !checkMsg(msg[name], message)) {
									console.warn('inner proto error! name: %j, proto: %j, msg: %j', name, proto, msg);
									return false;
								}
							}
							break;
						case 'repeated' :
							//Check nest message in repeated elements
							var message = protos.__messages[proto.type] || Encoder.protos['message ' + proto.type];
							if (!!msg[name] && !!message) {
								for (var i = 0; i < msg[name].length; i++) {
									if (!checkMsg(msg[name][i], message)) {
										return false;
									}
								}
							}
							break;
					}
				}

				return true;
			}

			function encodeMsg(buffer, offset, protos, msg) {
				for (var name in msg) {
					if (!!protos[name]) {
						var proto = protos[name];

						switch (proto.option) {
							case 'required' :
							case 'optional' :
								offset = writeBytes(buffer, offset, encodeTag(proto.type, proto.tag));
								offset = encodeProp(msg[name], proto.type, offset, buffer, protos);
								break;
							case 'repeated' :
								if (!!msg[name] && msg[name].length > 0) {
									offset = encodeArray(msg[name], proto, offset, buffer, protos);
								}
								break;
						}
					}
				}

				return offset;
			}

			function encodeProp(value, type, offset, buffer, protos) {
				var length = 0;

				switch (type) {
					case 'uInt32':
						offset = writeBytes(buffer, offset, codec.encodeUInt32(value));
						break;
					case 'int32' :
					case 'sInt32':
						offset = writeBytes(buffer, offset, codec.encodeSInt32(value));
						break;
					case 'float':
						buffer.writeFloatLE(value, offset);
						offset += 4;
						break;
					case 'double':
						buffer.writeDoubleLE(value, offset);
						offset += 8;
						break;
					case 'string':
						length = Buffer.byteLength(value);

						//Encode length
						offset = writeBytes(buffer, offset, codec.encodeUInt32(length));
						//write string
						buffer.write(value, offset, length);
						offset += length;
						break;
					default :
						var message = protos.__messages[type] || Encoder.protos['message ' + type];
						if (!!message) {
							//Use a tmp buffer to build an internal msg
							var tmpBuffer = new Buffer(Buffer.byteLength(JSON.stringify(value)) * 2);
							length = 0;

							length = encodeMsg(tmpBuffer, length, message, value);
							//Encode length
							offset = writeBytes(buffer, offset, codec.encodeUInt32(length));
							//contact the object
							tmpBuffer.copy(buffer, offset, 0, length);

							offset += length;
						}
						break;
				}

				return offset;
			}

			/**
			 * Encode reapeated properties, simple msg and object are decode differented
			 */
			function encodeArray(array, proto, offset, buffer, protos) {
				var i = 0;
				if (util.isSimpleType(proto.type)) {
					offset = writeBytes(buffer, offset, encodeTag(proto.type, proto.tag));
					offset = writeBytes(buffer, offset, codec.encodeUInt32(array.length));
					for (i = 0; i < array.length; i++) {
						offset = encodeProp(array[i], proto.type, offset, buffer);
					}
				} else {
					for (i = 0; i < array.length; i++) {
						offset = writeBytes(buffer, offset, encodeTag(proto.type, proto.tag));
						offset = encodeProp(array[i], proto.type, offset, buffer, protos);
					}
				}

				return offset;
			}

			function writeBytes(buffer, offset, bytes) {
				for (var i = 0; i < bytes.length; i++) {
					buffer.writeUInt8(bytes[i], offset);
					offset++;
				}

				return offset;
			}

			function encodeTag(type, tag) {
				var value = constant.TYPES[type];

				if (value === undefined) value = 2;

				return codec.encodeUInt32((tag << 3) | value);
			}

		}).call(this, require("buffer").Buffer)
	}, {"./codec": 4, "./constant": 5, "./util": 10, "buffer": 13}],
	8: [function (require, module, exports) {
		var Parser = module.exports;

		/**
		 * [parse the original protos, give the paresed result can be used by protobuf encode/decode.]
		 * @param  {[Object]} protos Original protos, in a js map.
		 * @return {[Object]} The presed result, a js object represent all the meta data of the given protos.
		 */
		Parser.parse = function (protos) {
			var maps = {};
			for (var key in protos) {
				maps[key] = parseObject(protos[key]);
			}

			return maps;
		};

		/**
		 * [parse a single protos, return a object represent the result. The method can be invocked recursively.]
		 * @param  {[Object]} obj The origin proto need to parse.
		 * @return {[Object]} The parsed result, a js object.
		 */
		function parseObject(obj) {
			var proto = {};
			var nestProtos = {};
			var tags = {};

			for (var name in obj) {
				var tag = obj[name];
				var params = name.split(' ');

				switch (params[0]) {
					case 'message':
						if (params.length !== 2) {
							continue;
						}
						nestProtos[params[1]] = parseObject(tag);
						continue;
					case 'required':
					case 'optional':
					case 'repeated': {
						//params length should be 3 and tag can't be duplicated
						if (params.length !== 3 || !!tags[tag]) {
							continue;
						}
						proto[params[2]] = {
							option: params[0],
							type: params[1],
							tag: tag
						};
						tags[tag] = params[2];
					}
				}
			}

			proto.__messages = nestProtos;
			proto.__tags = tags;
			return proto;
		}
	}, {}],
	9: [function (require, module, exports) {
		(function (Buffer) {
			var encoder = require('./encoder');
			var decoder = require('./decoder');
			var parser = require('./parser');

			var Protobuf = module.exports;

			/**
			 * [encode the given message, return a Buffer represent the message encoded by protobuf]
			 * @param  {[type]} key The key to identify the message type.
			 * @param  {[type]} msg The message body, a js object.
			 * @return {[type]} The binary encode result in a Buffer.
			 */
			Protobuf.encode = function (key, msg) {
				return encoder.encode(key, msg);
			};

			Protobuf.encode2Bytes = function (key, msg) {
				var buffer = this.encode(key, msg);
				if (!buffer || !buffer.length) {
					console.warn('encode msg failed! key : %j, msg : %j', key, msg);
					return null;
				}
				var bytes = new Uint8Array(buffer.length);
				for (var offset = 0; offset < buffer.length; offset++) {
					bytes[offset] = buffer.readUInt8(offset);
				}

				return bytes;
			};

			Protobuf.encodeStr = function (key, msg, code) {
				code = code || 'base64';
				var buffer = Protobuf.encode(key, msg);
				return !!buffer ? buffer.toString(code) : buffer;
			};

			Protobuf.decode = function (key, msg) {
				return decoder.decode(key, msg);
			};

			Protobuf.decodeStr = function (key, str, code) {
				code = code || 'base64';
				var buffer = new Buffer(str, code);

				return !!buffer ? Protobuf.decode(key, buffer) : buffer;
			};

			Protobuf.parse = function (json) {
				return parser.parse(json);
			};

			Protobuf.setEncoderProtos = function (protos) {
				encoder.init(protos);
			};

			Protobuf.setDecoderProtos = function (protos) {
				decoder.init(protos);
			};

			Protobuf.init = function (opts) {
				//On the serverside, use serverProtos to encode messages send to client
				encoder.init(opts.encoderProtos);

				//On the serverside, user clientProtos to decode messages receive from clients
				decoder.init(opts.decoderProtos);

			};
		}).call(this, require("buffer").Buffer)
	}, {"./decoder": 6, "./encoder": 7, "./parser": 8, "buffer": 13}],
	10: [function (require, module, exports) {
		var util = module.exports;

		util.isSimpleType = function (type) {
			return ( type === 'uInt32' ||
			type === 'sInt32' ||
			type === 'int32' ||
			type === 'uInt64' ||
			type === 'sInt64' ||
			type === 'float' ||
			type === 'double');
		};

		util.equal = function (obj0, obj1) {
			for (var key in obj0) {
				var m = obj0[key];
				var n = obj1[key];

				if (typeof(m) === 'object') {
					if (!util.equal(m, n)) {
						return false;
					}
				} else if (m !== n) {
					return false;
				}
			}

			return true;
		};
	}, {}],
	11: [function (require, module, exports) {
		module.exports = require('./lib/protocol');
	}, {"./lib/protocol": 12}],
	12: [function (require, module, exports) {
		(function (Buffer) {
			(function (exports, ByteArray, global) {
				var Protocol = exports;

				var PKG_HEAD_BYTES = 4;
				var MSG_FLAG_BYTES = 1;
				var MSG_ROUTE_CODE_BYTES = 2;
				var MSG_ID_MAX_BYTES = 5;
				var MSG_ROUTE_LEN_BYTES = 1;

				var MSG_ROUTE_CODE_MAX = 0xffff;

				var MSG_COMPRESS_ROUTE_MASK = 0x1;
				var MSG_TYPE_MASK = 0x7;

				var Package = Protocol.Package = {};
				var Message = Protocol.Message = {};

				Package.TYPE_HANDSHAKE = 1;
				Package.TYPE_HANDSHAKE_ACK = 2;
				Package.TYPE_HEARTBEAT = 3;
				Package.TYPE_DATA = 4;
				Package.TYPE_KICK = 5;

				Message.TYPE_REQUEST = 0;
				Message.TYPE_NOTIFY = 1;
				Message.TYPE_RESPONSE = 2;
				Message.TYPE_PUSH = 3;

				/**
				 * pomele client encode
				 * id message id;
				 * route message route
				 * msg message body
				 * socketio current support string
				 */
				Protocol.strencode = function (str) {
					if (typeof Buffer !== "undefined" && ByteArray === Buffer) {
						// encoding defaults to 'utf8'
						return (new Buffer(str));
					} else {
						var byteArray = new ByteArray(str.length * 3);
						var offset = 0;
						for (var i = 0; i < str.length; i++) {
							var charCode = str.charCodeAt(i);
							var codes = null;
							if (charCode <= 0x7f) {
								codes = [charCode];
							} else if (charCode <= 0x7ff) {
								codes = [0xc0 | (charCode >> 6), 0x80 | (charCode & 0x3f)];
							} else {
								codes = [0xe0 | (charCode >> 12), 0x80 | ((charCode & 0xfc0) >> 6), 0x80 | (charCode & 0x3f)];
							}
							for (var j = 0; j < codes.length; j++) {
								byteArray[offset] = codes[j];
								++offset;
							}
						}
						var _buffer = new ByteArray(offset);
						copyArray(_buffer, 0, byteArray, 0, offset);
						return _buffer;
					}
				};

				/**
				 * client decode
				 * msg String data
				 * return Message Object
				 */
				Protocol.strdecode = function (buffer) {
					if (typeof Buffer !== "undefined" && ByteArray === Buffer) {
						// encoding defaults to 'utf8'
						return buffer.toString();
					} else {
						var bytes = new ByteArray(buffer);
						var array = [];
						var offset = 0;
						var charCode = 0;
						var end = bytes.length;
						while (offset < end) {
							if (bytes[offset] < 128) {
								charCode = bytes[offset];
								offset += 1;
							} else if (bytes[offset] < 224) {
								charCode = ((bytes[offset] & 0x1f) << 6) + (bytes[offset + 1] & 0x3f);
								offset += 2;
							} else {
								charCode = ((bytes[offset] & 0x0f) << 12) + ((bytes[offset + 1] & 0x3f) << 6) + (bytes[offset + 2] & 0x3f);
								offset += 3;
							}
							array.push(charCode);
						}
						return String.fromCharCode.apply(null, array);
					}
				};

				/**
				 * Package protocol encode.
				 *
				 * Pomelo package format:
				 * +------+-------------+------------------+
				 * | type | body length |       body       |
				 * +------+-------------+------------------+
				 *
				 * Head: 4bytes
				 *   0: package type,
				 *      1 - handshake,
				 *      2 - handshake ack,
				 *      3 - heartbeat,
				 *      4 - data
				 *      5 - kick
				 *   1 - 3: big-endian body length
				 * Body: body length bytes
				 *
				 * @param  {Number}    type   package type
				 * @param  {ByteArray} body   body content in bytes
				 * @return {ByteArray}        new byte array that contains encode result
				 */
				Package.encode = function (type, body) {
					var length = body ? body.length : 0;
					var buffer = new ByteArray(PKG_HEAD_BYTES + length);
					var index = 0;
					buffer[index++] = type & 0xff;
					buffer[index++] = (length >> 16) & 0xff;
					buffer[index++] = (length >> 8) & 0xff;
					buffer[index++] = length & 0xff;
					if (body) {
						copyArray(buffer, index, body, 0, length);
					}
					return buffer;
				};

				/**
				 * Package protocol decode.
				 * See encode for package format.
				 *
				 * @param  {ByteArray} buffer byte array containing package content
				 * @return {Object}           {type: package type, buffer: body byte array}
				 */
				Package.decode = function (buffer) {
					var offset = 0;
					var bytes = new ByteArray(buffer);
					var length = 0;
					var rs = [];
					while (offset < bytes.length) {
						var type = bytes[offset++];
						length = ((bytes[offset++]) << 16 | (bytes[offset++]) << 8 | bytes[offset++]) >>> 0;
						var body = length ? new ByteArray(length) : null;
						if (body) {
							copyArray(body, 0, bytes, offset, length);
						}
						offset += length;
						rs.push({'type': type, 'body': body});
					}
					return rs.length === 1 ? rs[0] : rs;
				};

				/**
				 * Message protocol encode.
				 *
				 * @param  {Number} id            message id
				 * @param  {Number} type          message type
				 * @param  {Number} compressRoute whether compress route
				 * @param  {Number|String} route  route code or route string
				 * @param  {Buffer} msg           message body bytes
				 * @return {Buffer}               encode result
				 */
				Message.encode = function (id, type, compressRoute, route, msg) {
					// caculate message max length
					var idBytes = msgHasId(type) ? caculateMsgIdBytes(id) : 0;
					var msgLen = MSG_FLAG_BYTES + idBytes;

					if (msgHasRoute(type)) {
						if (compressRoute) {
							if (typeof route !== 'number') {
								throw new Error('error flag for number route!');
							}
							msgLen += MSG_ROUTE_CODE_BYTES;
						} else {
							msgLen += MSG_ROUTE_LEN_BYTES;
							if (route) {
								route = Protocol.strencode(route);
								if (route.length > 255) {
									throw new Error('route maxlength is overflow');
								}
								msgLen += route.length;
							}
						}
					}

					if (msg) {
						msgLen += msg.length;
					}

					var buffer = new ByteArray(msgLen);
					var offset = 0;

					// add flag
					offset = encodeMsgFlag(type, compressRoute, buffer, offset);

					// add message id
					if (msgHasId(type)) {
						offset = encodeMsgId(id, buffer, offset);
					}

					// add route
					if (msgHasRoute(type)) {
						offset = encodeMsgRoute(compressRoute, route, buffer, offset);
					}

					// add body
					if (msg) {
						offset = encodeMsgBody(msg, buffer, offset);
					}

					return buffer;
				};

				/**
				 * Message protocol decode.
				 *
				 * @param  {Buffer|Uint8Array} buffer message bytes
				 * @return {Object}            message object
				 */
				Message.decode = function (buffer) {
					var bytes = new ByteArray(buffer);
					var bytesLen = bytes.length || bytes.byteLength;
					var offset = 0;
					var id = 0;
					var route = null;

					// parse flag
					var flag = bytes[offset++];
					var compressRoute = flag & MSG_COMPRESS_ROUTE_MASK;
					var type = (flag >> 1) & MSG_TYPE_MASK;

					// parse id
					if (msgHasId(type)) {
						var m = 0;
						var i = 0;
						do {
							m = parseInt(bytes[offset]);
							id += (m & 0x7f) << (7 * i);
							offset++;
							i++;
						} while (m >= 128);
					}

					// parse route
					if (msgHasRoute(type)) {
						if (compressRoute) {
							route = (bytes[offset++]) << 8 | bytes[offset++];
						} else {
							var routeLen = bytes[offset++];
							if (routeLen) {
								route = new ByteArray(routeLen);
								copyArray(route, 0, bytes, offset, routeLen);
								route = Protocol.strdecode(route);
							} else {
								route = '';
							}
							offset += routeLen;
						}
					}

					// parse body
					var bodyLen = bytesLen - offset;
					var body = new ByteArray(bodyLen);

					copyArray(body, 0, bytes, offset, bodyLen);

					return {
						'id': id, 'type': type, 'compressRoute': compressRoute,
						'route': route, 'body': body
					};
				};

				var copyArray = function (dest, doffset, src, soffset, length) {
					if ('function' === typeof src.copy) {
						// Buffer
						src.copy(dest, doffset, soffset, soffset + length);
					} else {
						// Uint8Array
						for (var index = 0; index < length; index++) {
							dest[doffset++] = src[soffset++];
						}
					}
				};

				var msgHasId = function (type) {
					return type === Message.TYPE_REQUEST || type === Message.TYPE_RESPONSE;
				};

				var msgHasRoute = function (type) {
					return type === Message.TYPE_REQUEST || type === Message.TYPE_NOTIFY ||
						type === Message.TYPE_PUSH;
				};

				var caculateMsgIdBytes = function (id) {
					var len = 0;
					do {
						len += 1;
						id >>= 7;
					} while (id > 0);
					return len;
				};

				var encodeMsgFlag = function (type, compressRoute, buffer, offset) {
					if (type !== Message.TYPE_REQUEST && type !== Message.TYPE_NOTIFY &&
						type !== Message.TYPE_RESPONSE && type !== Message.TYPE_PUSH) {
						throw new Error('unkonw message type: ' + type);
					}

					buffer[offset] = (type << 1) | (compressRoute ? 1 : 0);

					return offset + MSG_FLAG_BYTES;
				};

				var encodeMsgId = function (id, buffer, offset) {
					do {
						var tmp = id % 128;
						var next = Math.floor(id / 128);

						if (next !== 0) {
							tmp = tmp + 128;
						}
						buffer[offset++] = tmp;

						id = next;
					} while (id !== 0);

					return offset;
				};

				var encodeMsgRoute = function (compressRoute, route, buffer, offset) {
					if (compressRoute) {
						if (route > MSG_ROUTE_CODE_MAX) {
							throw new Error('route number is overflow');
						}

						buffer[offset++] = (route >> 8) & 0xff;
						buffer[offset++] = route & 0xff;
					} else {
						if (route) {
							buffer[offset++] = route.length & 0xff;
							copyArray(buffer, offset, route, 0, route.length);
							offset += route.length;
						} else {
							buffer[offset++] = 0;
						}
					}

					return offset;
				};

				var encodeMsgBody = function (msg, buffer, offset) {
					copyArray(buffer, offset, msg, 0, msg.length);
					return offset + msg.length;
				};

				module.exports = Protocol;
				if (typeof(window) != "undefined") {
					window.Protocol = Protocol;
				}
			})(typeof(window) == "undefined" ? module.exports : (this.Protocol = {}), typeof(window) == "undefined" ? Buffer : Uint8Array, this);

		}).call(this, require("buffer").Buffer)
	}, {"buffer": 13}],
	13: [function (require, module, exports) {
		(function (global) {
			/*!
			 * The buffer module from node.js, for the browser.
			 *
			 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
			 * @license  MIT
			 */
			/* eslint-disable no-proto */

			'use strict';

			var base64 = require('base64-js');
			var ieee754 = require('ieee754');
			var isArray = require('isarray');

			exports.Buffer = Buffer;
			exports.SlowBuffer = SlowBuffer;
			exports.INSPECT_MAX_BYTES = 50;

			/**
			 * If `Buffer.TYPED_ARRAY_SUPPORT`:
			 *   === true    Use Uint8Array implementation (fastest)
			 *   === false   Use Object implementation (most compatible, even IE6)
			 *
			 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
			 * Opera 11.6+, iOS 4.2+.
			 *
			 * Due to various browser bugs, sometimes the Object implementation will be used even
			 * when the browser supports typed arrays.
			 *
			 * Note:
			 *
			 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
			 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
			 *
			 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
			 *
			 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
			 *     incorrect length in some situations.

			 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
			 * get the Object implementation, which is slower but behaves correctly.
			 */
			Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
				? global.TYPED_ARRAY_SUPPORT
				: typedArraySupport();

			/*
			 * Export kMaxLength after typed array support is determined.
			 */
			exports.kMaxLength = kMaxLength();

			function typedArraySupport() {
				try {
					var arr = new Uint8Array(1);
					arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }};
					return arr.foo() === 42 && // typed array instances can be augmented
						typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
						arr.subarray(1, 1).byteLength === 0; // ie10 has broken `subarray`
				} catch (e) {
					return false
				}
			}

			function kMaxLength() {
				return Buffer.TYPED_ARRAY_SUPPORT
					? 0x7fffffff
					: 0x3fffffff
			}

			function createBuffer(that, length) {
				if (kMaxLength() < length) {
					throw new RangeError('Invalid typed array length')
				}
				if (Buffer.TYPED_ARRAY_SUPPORT) {
					// Return an augmented `Uint8Array` instance, for best performance
					that = new Uint8Array(length);
					that.__proto__ = Buffer.prototype
				} else {
					// Fallback: Return an object instance of the Buffer class
					if (that === null) {
						that = new Buffer(length)
					}
					that.length = length
				}

				return that
			}

			/**
			 * The Buffer constructor returns instances of `Uint8Array` that have their
			 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
			 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
			 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
			 * returns a single octet.
			 *
			 * The `Uint8Array` prototype remains unmodified.
			 */

			function Buffer(arg, encodingOrOffset, length) {
				if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
					return new Buffer(arg, encodingOrOffset, length)
				}

				// Common case.
				if (typeof arg === 'number') {
					if (typeof encodingOrOffset === 'string') {
						throw new Error(
							'If encoding is specified then the first argument must be a string'
						)
					}
					return allocUnsafe(this, arg)
				}
				return from(this, arg, encodingOrOffset, length)
			}

			Buffer.poolSize = 8192; // not used by this implementation

			// TODO: Legacy, not needed anymore. Remove in next major version.
			Buffer._augment = function (arr) {
				arr.__proto__ = Buffer.prototype;
				return arr
			};

			function from(that, value, encodingOrOffset, length) {
				if (typeof value === 'number') {
					throw new TypeError('"value" argument must not be a number')
				}

				if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
					return fromArrayBuffer(that, value, encodingOrOffset, length)
				}

				if (typeof value === 'string') {
					return fromString(that, value, encodingOrOffset)
				}

				return fromObject(that, value)
			}

			/**
			 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
			 * if value is a number.
			 * Buffer.from(str[, encoding])
			 * Buffer.from(array)
			 * Buffer.from(buffer)
			 * Buffer.from(arrayBuffer[, byteOffset[, length]])
			 **/
			Buffer.from = function (value, encodingOrOffset, length) {
				return from(null, value, encodingOrOffset, length)
			};

			if (Buffer.TYPED_ARRAY_SUPPORT) {
				Buffer.prototype.__proto__ = Uint8Array.prototype;
				Buffer.__proto__ = Uint8Array;
				if (typeof Symbol !== 'undefined' && Symbol.species &&
					Buffer[Symbol.species] === Buffer) {
					// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
					Object.defineProperty(Buffer, Symbol.species, {
						value: null,
						configurable: true
					})
				}
			}

			function assertSize(size) {
				if (typeof size !== 'number') {
					throw new TypeError('"size" argument must be a number')
				} else if (size < 0) {
					throw new RangeError('"size" argument must not be negative')
				}
			}

			function alloc(that, size, fill, encoding) {
				assertSize(size);
				if (size <= 0) {
					return createBuffer(that, size)
				}
				if (fill !== undefined) {
					// Only pay attention to encoding if it's a string. This
					// prevents accidentally sending in a number that would
					// be interpretted as a start offset.
					return typeof encoding === 'string'
						? createBuffer(that, size).fill(fill, encoding)
						: createBuffer(that, size).fill(fill)
				}
				return createBuffer(that, size)
			}

			/**
			 * Creates a new filled Buffer instance.
			 * alloc(size[, fill[, encoding]])
			 **/
			Buffer.alloc = function (size, fill, encoding) {
				return alloc(null, size, fill, encoding)
			};

			function allocUnsafe(that, size) {
				assertSize(size);
				that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
				if (!Buffer.TYPED_ARRAY_SUPPORT) {
					for (var i = 0; i < size; ++i) {
						that[i] = 0
					}
				}
				return that
			}

			/**
			 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
			 * */
			Buffer.allocUnsafe = function (size) {
				return allocUnsafe(null, size)
			};
			/**
			 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
			 */
			Buffer.allocUnsafeSlow = function (size) {
				return allocUnsafe(null, size)
			};

			function fromString(that, string, encoding) {
				if (typeof encoding !== 'string' || encoding === '') {
					encoding = 'utf8'
				}

				if (!Buffer.isEncoding(encoding)) {
					throw new TypeError('"encoding" must be a valid string encoding')
				}

				var length = byteLength(string, encoding) | 0;
				that = createBuffer(that, length);

				var actual = that.write(string, encoding);

				if (actual !== length) {
					// Writing a hex string, for example, that contains invalid characters will
					// cause everything after the first invalid character to be ignored. (e.g.
					// 'abxxcd' will be treated as 'ab')
					that = that.slice(0, actual)
				}

				return that
			}

			function fromArrayLike(that, array) {
				var length = array.length < 0 ? 0 : checked(array.length) | 0;
				that = createBuffer(that, length);
				for (var i = 0; i < length; i += 1) {
					that[i] = array[i] & 255
				}
				return that
			}

			function fromArrayBuffer(that, array, byteOffset, length) {
				array.byteLength; // this throws if `array` is not a valid ArrayBuffer

				if (byteOffset < 0 || array.byteLength < byteOffset) {
					throw new RangeError('\'offset\' is out of bounds')
				}

				if (array.byteLength < byteOffset + (length || 0)) {
					throw new RangeError('\'length\' is out of bounds')
				}

				if (byteOffset === undefined && length === undefined) {
					array = new Uint8Array(array)
				} else if (length === undefined) {
					array = new Uint8Array(array, byteOffset)
				} else {
					array = new Uint8Array(array, byteOffset, length)
				}

				if (Buffer.TYPED_ARRAY_SUPPORT) {
					// Return an augmented `Uint8Array` instance, for best performance
					that = array;
					that.__proto__ = Buffer.prototype
				} else {
					// Fallback: Return an object instance of the Buffer class
					that = fromArrayLike(that, array)
				}
				return that
			}

			function fromObject(that, obj) {
				if (Buffer.isBuffer(obj)) {
					var len = checked(obj.length) | 0;
					that = createBuffer(that, len);

					if (that.length === 0) {
						return that
					}

					obj.copy(that, 0, 0, len);
					return that
				}

				if (obj) {
					if ((typeof ArrayBuffer !== 'undefined' &&
						obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
						if (typeof obj.length !== 'number' || isnan(obj.length)) {
							return createBuffer(that, 0)
						}
						return fromArrayLike(that, obj)
					}

					if (obj.type === 'Buffer' && isArray(obj.data)) {
						return fromArrayLike(that, obj.data)
					}
				}

				throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
			}

			function checked(length) {
				// Note: cannot use `length < kMaxLength()` here because that fails when
				// length is NaN (which is otherwise coerced to zero.)
				if (length >= kMaxLength()) {
					throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
						'size: 0x' + kMaxLength().toString(16) + ' bytes')
				}
				return length | 0
			}

			function SlowBuffer(length) {
				if (+length != length) { // eslint-disable-line eqeqeq
					length = 0
				}
				return Buffer.alloc(+length)
			}

			Buffer.isBuffer = function isBuffer(b) {
				return !!(b != null && b._isBuffer)
			};

			Buffer.compare = function compare(a, b) {
				if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
					throw new TypeError('Arguments must be Buffers')
				}

				if (a === b) return 0;

				var x = a.length;
				var y = b.length;

				for (var i = 0, len = Math.min(x, y); i < len; ++i) {
					if (a[i] !== b[i]) {
						x = a[i];
						y = b[i];
						break
					}
				}

				if (x < y) return -1;
				if (y < x) return 1;
				return 0
			};

			Buffer.isEncoding = function isEncoding(encoding) {
				switch (String(encoding).toLowerCase()) {
					case 'hex':
					case 'utf8':
					case 'utf-8':
					case 'ascii':
					case 'latin1':
					case 'binary':
					case 'base64':
					case 'ucs2':
					case 'ucs-2':
					case 'utf16le':
					case 'utf-16le':
						return true;
					default:
						return false
				}
			};

			Buffer.concat = function concat(list, length) {
				if (!isArray(list)) {
					throw new TypeError('"list" argument must be an Array of Buffers')
				}

				if (list.length === 0) {
					return Buffer.alloc(0)
				}

				var i;
				if (length === undefined) {
					length = 0;
					for (i = 0; i < list.length; ++i) {
						length += list[i].length
					}
				}

				var buffer = Buffer.allocUnsafe(length);
				var pos = 0;
				for (i = 0; i < list.length; ++i) {
					var buf = list[i];
					if (!Buffer.isBuffer(buf)) {
						throw new TypeError('"list" argument must be an Array of Buffers')
					}
					buf.copy(buffer, pos);
					pos += buf.length
				}
				return buffer
			};

			function byteLength(string, encoding) {
				if (Buffer.isBuffer(string)) {
					return string.length
				}
				if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
					(ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
					return string.byteLength
				}
				if (typeof string !== 'string') {
					string = '' + string
				}

				var len = string.length;
				if (len === 0) return 0;

				// Use a for loop to avoid recursion
				var loweredCase = false;
				for (; ;) {
					switch (encoding) {
						case 'ascii':
						case 'latin1':
						case 'binary':
							return len;
						case 'utf8':
						case 'utf-8':
						case undefined:
							return utf8ToBytes(string).length;
						case 'ucs2':
						case 'ucs-2':
						case 'utf16le':
						case 'utf-16le':
							return len * 2;
						case 'hex':
							return len >>> 1;
						case 'base64':
							return base64ToBytes(string).length;
						default:
							if (loweredCase) return utf8ToBytes(string).length;;; // assume utf8
							encoding = ('' + encoding).toLowerCase();
							loweredCase = true
					}
				}
			}

			Buffer.byteLength = byteLength;

			function slowToString(encoding, start, end) {
				var loweredCase = false;

				// No need to verify that "this.length <= MAX_UINT32" since it's a read-only
				// property of a typed array.

				// This behaves neither like String nor Uint8Array in that we set start/end
				// to their upper/lower bounds if the value passed is out of range.
				// undefined is handled specially as per ECMA-262 6th Edition,
				// Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
				if (start === undefined || start < 0) {
					start = 0
				}
				// Return early if start > this.length. Done here to prevent potential uint32
				// coercion fail below.
				if (start > this.length) {
					return ''
				}

				if (end === undefined || end > this.length) {
					end = this.length
				}

				if (end <= 0) {
					return ''
				}

				// Force coersion to uint32. This will also coerce falsey/NaN values to 0.
				end >>>= 0;
				start >>>= 0;

				if (end <= start) {
					return ''
				}

				if (!encoding) encoding = 'utf8';

				while (true) {
					switch (encoding) {
						case 'hex':
							return hexSlice(this, start, end);

						case 'utf8':
						case 'utf-8':
							return utf8Slice(this, start, end);

						case 'ascii':
							return asciiSlice(this, start, end);

						case 'latin1':
						case 'binary':
							return latin1Slice(this, start, end);

						case 'base64':
							return base64Slice(this, start, end);

						case 'ucs2':
						case 'ucs-2':
						case 'utf16le':
						case 'utf-16le':
							return utf16leSlice(this, start, end);

						default:
							if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
							encoding = (encoding + '').toLowerCase();
							loweredCase = true
					}
				}
			}

			// The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
			// Buffer instances.
			Buffer.prototype._isBuffer = true;

			function swap(b, n, m) {
				var i = b[n];
				b[n] = b[m];
				b[m] = i
			}

			Buffer.prototype.swap16 = function swap16() {
				var len = this.length;
				if (len % 2 !== 0) {
					throw new RangeError('Buffer size must be a multiple of 16-bits')
				}
				for (var i = 0; i < len; i += 2) {
					swap(this, i, i + 1)
				}
				return this
			};

			Buffer.prototype.swap32 = function swap32() {
				var len = this.length;
				if (len % 4 !== 0) {
					throw new RangeError('Buffer size must be a multiple of 32-bits')
				}
				for (var i = 0; i < len; i += 4) {
					swap(this, i, i + 3);
					swap(this, i + 1, i + 2)
				}
				return this
			};

			Buffer.prototype.swap64 = function swap64() {
				var len = this.length;
				if (len % 8 !== 0) {
					throw new RangeError('Buffer size must be a multiple of 64-bits')
				}
				for (var i = 0; i < len; i += 8) {
					swap(this, i, i + 7);
					swap(this, i + 1, i + 6);
					swap(this, i + 2, i + 5);
					swap(this, i + 3, i + 4)
				}
				return this
			};

			Buffer.prototype.toString = function toString() {
				var length = this.length | 0;
				if (length === 0) return '';
				if (arguments.length === 0) return utf8Slice(this, 0, length);
				return slowToString.apply(this, arguments)
			};

			Buffer.prototype.equals = function equals(b) {
				if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
				if (this === b) return true;
				return Buffer.compare(this, b) === 0
			};

			Buffer.prototype.inspect = function inspect() {
				var str = '';
				var max = exports.INSPECT_MAX_BYTES;
				if (this.length > 0) {
					str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
					if (this.length > max) str += ' ... '
				}
				return '<Buffer ' + str + '>'
			};

			Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
				if (!Buffer.isBuffer(target)) {
					throw new TypeError('Argument must be a Buffer')
				}

				if (start === undefined) {
					start = 0
				}
				if (end === undefined) {
					end = target ? target.length : 0
				}
				if (thisStart === undefined) {
					thisStart = 0
				}
				if (thisEnd === undefined) {
					thisEnd = this.length
				}

				if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
					throw new RangeError('out of range index')
				}

				if (thisStart >= thisEnd && start >= end) {
					return 0
				}
				if (thisStart >= thisEnd) {
					return -1
				}
				if (start >= end) {
					return 1
				}

				start >>>= 0;
				end >>>= 0;
				thisStart >>>= 0;
				thisEnd >>>= 0;

				if (this === target) return 0;

				var x = thisEnd - thisStart;
				var y = end - start;
				var len = Math.min(x, y);

				var thisCopy = this.slice(thisStart, thisEnd);
				var targetCopy = target.slice(start, end);

				for (var i = 0; i < len; ++i) {
					if (thisCopy[i] !== targetCopy[i]) {
						x = thisCopy[i];
						y = targetCopy[i];
						break
					}
				}

				if (x < y) return -1;
				if (y < x) return 1;
				return 0
			};

			// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
			// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
			//
			// Arguments:
			// - buffer - a Buffer to search
			// - val - a string, Buffer, or number
			// - byteOffset - an index into `buffer`; will be clamped to an int32
			// - encoding - an optional encoding, relevant is val is a string
			// - dir - true for indexOf, false for lastIndexOf
			function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
				// Empty buffer means no match
				if (buffer.length === 0) return -1;

				// Normalize byteOffset
				if (typeof byteOffset === 'string') {
					encoding = byteOffset;
					byteOffset = 0
				} else if (byteOffset > 0x7fffffff) {
					byteOffset = 0x7fffffff
				} else if (byteOffset < -0x80000000) {
					byteOffset = -0x80000000
				}
				byteOffset = +byteOffset;  // Coerce to Number.
				if (isNaN(byteOffset)) {
					// byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
					byteOffset = dir ? 0 : (buffer.length - 1)
				}

				// Normalize byteOffset: negative offsets start from the end of the buffer
				if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
				if (byteOffset >= buffer.length) {
					if (dir) return -1;
					else byteOffset = buffer.length - 1
				} else if (byteOffset < 0) {
					if (dir) byteOffset = 0;
					else return -1
				}

				// Normalize val
				if (typeof val === 'string') {
					val = Buffer.from(val, encoding)
				}

				// Finally, search either indexOf (if dir is true) or lastIndexOf
				if (Buffer.isBuffer(val)) {
					// Special case: looking for empty string/buffer always fails
					if (val.length === 0) {
						return -1
					}
					return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
				} else if (typeof val === 'number') {
					val = val & 0xFF; // Search for a byte value [0-255]
					if (Buffer.TYPED_ARRAY_SUPPORT &&
						typeof Uint8Array.prototype.indexOf === 'function') {
						if (dir) {
							return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
						} else {
							return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
						}
					}
					return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
				}

				throw new TypeError('val must be string, number or Buffer')
			}

			function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
				var indexSize = 1;
				var arrLength = arr.length;
				var valLength = val.length;

				if (encoding !== undefined) {
					encoding = String(encoding).toLowerCase();
					if (encoding === 'ucs2' || encoding === 'ucs-2' ||
						encoding === 'utf16le' || encoding === 'utf-16le') {
						if (arr.length < 2 || val.length < 2) {
							return -1
						}
						indexSize = 2;
						arrLength /= 2;
						valLength /= 2;
						byteOffset /= 2
					}
				}

				function read(buf, i) {
					if (indexSize === 1) {
						return buf[i]
					} else {
						return buf.readUInt16BE(i * indexSize)
					}
				}

				var i;
				if (dir) {
					var foundIndex = -1;
					for (i = byteOffset; i < arrLength; i++) {
						if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
							if (foundIndex === -1) foundIndex = i;
							if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
						} else {
							if (foundIndex !== -1) i -= i - foundIndex;
							foundIndex = -1
						}
					}
				} else {
					if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
					for (i = byteOffset; i >= 0; i--) {
						var found = true;
						for (var j = 0; j < valLength; j++) {
							if (read(arr, i + j) !== read(val, j)) {
								found = false;
								break
							}
						}
						if (found) return i
					}
				}

				return -1
			}

			Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
				return this.indexOf(val, byteOffset, encoding) !== -1
			};

			Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
				return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
			};

			Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
				return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
			};

			function hexWrite(buf, string, offset, length) {
				offset = Number(offset) || 0;
				var remaining = buf.length - offset;
				if (!length) {
					length = remaining
				} else {
					length = Number(length);
					if (length > remaining) {
						length = remaining
					}
				}

				// must be an even number of digits
				var strLen = string.length;
				if (strLen % 2 !== 0) throw new TypeError('Invalid hex string');

				if (length > strLen / 2) {
					length = strLen / 2
				}
				for (var i = 0; i < length; ++i) {
					var parsed = parseInt(string.substr(i * 2, 2), 16);
					if (isNaN(parsed)) return i;
					buf[offset + i] = parsed
				}
				return i
			}

			function utf8Write(buf, string, offset, length) {
				return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
			}

			function asciiWrite(buf, string, offset, length) {
				return blitBuffer(asciiToBytes(string), buf, offset, length)
			}

			function latin1Write(buf, string, offset, length) {
				return asciiWrite(buf, string, offset, length)
			}

			function base64Write(buf, string, offset, length) {
				return blitBuffer(base64ToBytes(string), buf, offset, length)
			}

			function ucs2Write(buf, string, offset, length) {
				return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
			}

			Buffer.prototype.write = function write(string, offset, length, encoding) {
				// Buffer#write(string)
				if (offset === undefined) {
					encoding = 'utf8';
					length = this.length;
					offset = 0;
					// Buffer#write(string, encoding)
				} else if (length === undefined && typeof offset === 'string') {
					encoding = offset;
					length = this.length;
					offset = 0;
					// Buffer#write(string, offset[, length][, encoding])
				} else if (isFinite(offset)) {
					offset = offset | 0;
					if (isFinite(length)) {
						length = length | 0;
						if (encoding === undefined) encoding = 'utf8'
					} else {
						encoding = length;
						length = undefined
					}
					// legacy write(string, encoding, offset, length) - remove in v0.13
				} else {
					throw new Error(
						'Buffer.write(string, encoding, offset[, length]) is no longer supported'
					)
				}

				var remaining = this.length - offset;
				if (length === undefined || length > remaining) length = remaining;

				if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
					throw new RangeError('Attempt to write outside buffer bounds')
				}

				if (!encoding) encoding = 'utf8';

				var loweredCase = false;
				for (; ;) {
					switch (encoding) {
						case 'hex':
							return hexWrite(this, string, offset, length);

						case 'utf8':
						case 'utf-8':
							return utf8Write(this, string, offset, length);

						case 'ascii':
							return asciiWrite(this, string, offset, length);

						case 'latin1':
						case 'binary':
							return latin1Write(this, string, offset, length);

						case 'base64':
							// Warning: maxLength not taken into account in base64Write
							return base64Write(this, string, offset, length);

						case 'ucs2':
						case 'ucs-2':
						case 'utf16le':
						case 'utf-16le':
							return ucs2Write(this, string, offset, length);

						default:
							if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
							encoding = ('' + encoding).toLowerCase();
							loweredCase = true
					}
				}
			};

			Buffer.prototype.toJSON = function toJSON() {
				return {
					type: 'Buffer',
					data: Array.prototype.slice.call(this._arr || this, 0)
				}
			};

			function base64Slice(buf, start, end) {
				if (start === 0 && end === buf.length) {
					return base64.fromByteArray(buf)
				} else {
					return base64.fromByteArray(buf.slice(start, end))
				}
			}

			function utf8Slice(buf, start, end) {
				end = Math.min(buf.length, end);
				var res = [];

				var i = start;
				while (i < end) {
					var firstByte = buf[i];
					var codePoint = null;
					var bytesPerSequence = (firstByte > 0xEF) ? 4
						: (firstByte > 0xDF) ? 3
							: (firstByte > 0xBF) ? 2
								: 1;

					if (i + bytesPerSequence <= end) {
						var secondByte, thirdByte, fourthByte, tempCodePoint;

						switch (bytesPerSequence) {
							case 1:
								if (firstByte < 0x80) {
									codePoint = firstByte
								}
								break;
							case 2:
								secondByte = buf[i + 1];
								if ((secondByte & 0xC0) === 0x80) {
									tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
									if (tempCodePoint > 0x7F) {
										codePoint = tempCodePoint
									}
								}
								break;
							case 3:
								secondByte = buf[i + 1];
								thirdByte = buf[i + 2];
								if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
									tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
									if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
										codePoint = tempCodePoint
									}
								}
								break;
							case 4:
								secondByte = buf[i + 1];
								thirdByte = buf[i + 2];
								fourthByte = buf[i + 3];
								if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
									tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
									if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
										codePoint = tempCodePoint
									}
								}
						}
					}

					if (codePoint === null) {
						// we did not generate a valid codePoint so insert a
						// replacement char (U+FFFD) and advance only 1 byte
						codePoint = 0xFFFD;
						bytesPerSequence = 1
					} else if (codePoint > 0xFFFF) {
						// encode to utf16 (surrogate pair dance)
						codePoint -= 0x10000;
						res.push(codePoint >>> 10 & 0x3FF | 0xD800);
						codePoint = 0xDC00 | codePoint & 0x3FF
					}

					res.push(codePoint);
					i += bytesPerSequence
				}

				return decodeCodePointsArray(res)
			}

			// Based on http://stackoverflow.com/a/22747272/680742, the browser with
			// the lowest limit is Chrome, with 0x10000 args.
			// We go 1 magnitude less, for safety
			var MAX_ARGUMENTS_LENGTH = 0x1000;

			function decodeCodePointsArray(codePoints) {
				var len = codePoints.length;
				if (len <= MAX_ARGUMENTS_LENGTH) {
					return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
				}

				// Decode in chunks to avoid "call stack size exceeded".
				var res = '';
				var i = 0;
				while (i < len) {
					res += String.fromCharCode.apply(
						String,
						codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
					)
				}
				return res
			}

			function asciiSlice(buf, start, end) {
				var ret = '';
				end = Math.min(buf.length, end);

				for (var i = start; i < end; ++i) {
					ret += String.fromCharCode(buf[i] & 0x7F)
				}
				return ret
			}

			function latin1Slice(buf, start, end) {
				var ret = '';
				end = Math.min(buf.length, end);

				for (var i = start; i < end; ++i) {
					ret += String.fromCharCode(buf[i])
				}
				return ret
			}

			function hexSlice(buf, start, end) {
				var len = buf.length;

				if (!start || start < 0) start = 0;
				if (!end || end < 0 || end > len) end = len;

				var out = '';
				for (var i = start; i < end; ++i) {
					out += toHex(buf[i])
				}
				return out
			}

			function utf16leSlice(buf, start, end) {
				var bytes = buf.slice(start, end);
				var res = '';
				for (var i = 0; i < bytes.length; i += 2) {
					res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
				}
				return res
			}

			Buffer.prototype.slice = function slice(start, end) {
				var len = this.length;
				start = ~~start;
				end = end === undefined ? len : ~~end;

				if (start < 0) {
					start += len;
					if (start < 0) start = 0
				} else if (start > len) {
					start = len
				}

				if (end < 0) {
					end += len;
					if (end < 0) end = 0
				} else if (end > len) {
					end = len
				}

				if (end < start) end = start;

				var newBuf;
				if (Buffer.TYPED_ARRAY_SUPPORT) {
					newBuf = this.subarray(start, end);
					newBuf.__proto__ = Buffer.prototype
				} else {
					var sliceLen = end - start;
					newBuf = new Buffer(sliceLen, undefined);
					for (var i = 0; i < sliceLen; ++i) {
						newBuf[i] = this[i + start]
					}
				}

				return newBuf
			};

			/*
			 * Need to make sure that buffer isn't trying to write out of bounds.
			 */
			function checkOffset(offset, ext, length) {
				if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint');
				if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
			}

			Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
				offset = offset | 0;
				byteLength = byteLength | 0;
				if (!noAssert) checkOffset(offset, byteLength, this.length);

				var val = this[offset];
				var mul = 1;
				var i = 0;
				while (++i < byteLength && (mul *= 0x100)) {
					val += this[offset + i] * mul
				}

				return val
			};

			Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
				offset = offset | 0;
				byteLength = byteLength | 0;
				if (!noAssert) {
					checkOffset(offset, byteLength, this.length)
				}

				var val = this[offset + --byteLength];
				var mul = 1;
				while (byteLength > 0 && (mul *= 0x100)) {
					val += this[offset + --byteLength] * mul
				}

				return val
			};

			Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
				if (!noAssert) checkOffset(offset, 1, this.length);
				return this[offset]
			};

			Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
				if (!noAssert) checkOffset(offset, 2, this.length);
				return this[offset] | (this[offset + 1] << 8)
			};

			Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
				if (!noAssert) checkOffset(offset, 2, this.length);
				return (this[offset] << 8) | this[offset + 1]
			};

			Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
				if (!noAssert) checkOffset(offset, 4, this.length);

				return ((this[offset]) |
					(this[offset + 1] << 8) |
					(this[offset + 2] << 16)) +
					(this[offset + 3] * 0x1000000)
			};

			Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
				if (!noAssert) checkOffset(offset, 4, this.length);

				return (this[offset] * 0x1000000) +
					((this[offset + 1] << 16) |
					(this[offset + 2] << 8) |
					this[offset + 3])
			};

			Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
				offset = offset | 0;
				byteLength = byteLength | 0;
				if (!noAssert) checkOffset(offset, byteLength, this.length);

				var val = this[offset];
				var mul = 1;
				var i = 0;
				while (++i < byteLength && (mul *= 0x100)) {
					val += this[offset + i] * mul
				}
				mul *= 0x80;

				if (val >= mul) val -= Math.pow(2, 8 * byteLength);

				return val
			};

			Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
				offset = offset | 0;
				byteLength = byteLength | 0;
				if (!noAssert) checkOffset(offset, byteLength, this.length);

				var i = byteLength;
				var mul = 1;
				var val = this[offset + --i];
				while (i > 0 && (mul *= 0x100)) {
					val += this[offset + --i] * mul
				}
				mul *= 0x80;

				if (val >= mul) val -= Math.pow(2, 8 * byteLength);

				return val
			};

			Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
				if (!noAssert) checkOffset(offset, 1, this.length);
				if (!(this[offset] & 0x80)) return (this[offset]);
				return ((0xff - this[offset] + 1) * -1)
			};

			Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
				if (!noAssert) checkOffset(offset, 2, this.length);
				var val = this[offset] | (this[offset + 1] << 8);
				return (val & 0x8000) ? val | 0xFFFF0000 : val
			};

			Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
				if (!noAssert) checkOffset(offset, 2, this.length);
				var val = this[offset + 1] | (this[offset] << 8);
				return (val & 0x8000) ? val | 0xFFFF0000 : val
			};

			Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
				if (!noAssert) checkOffset(offset, 4, this.length);

				return (this[offset]) |
					(this[offset + 1] << 8) |
					(this[offset + 2] << 16) |
					(this[offset + 3] << 24)
			};

			Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
				if (!noAssert) checkOffset(offset, 4, this.length);

				return (this[offset] << 24) |
					(this[offset + 1] << 16) |
					(this[offset + 2] << 8) |
					(this[offset + 3])
			};

			Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
				if (!noAssert) checkOffset(offset, 4, this.length);
				return ieee754.read(this, offset, true, 23, 4)
			};

			Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
				if (!noAssert) checkOffset(offset, 4, this.length);
				return ieee754.read(this, offset, false, 23, 4)
			};

			Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
				if (!noAssert) checkOffset(offset, 8, this.length);
				return ieee754.read(this, offset, true, 52, 8)
			};

			Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
				if (!noAssert) checkOffset(offset, 8, this.length);
				return ieee754.read(this, offset, false, 52, 8)
			};

			function checkInt(buf, value, offset, ext, max, min) {
				if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
				if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
				if (offset + ext > buf.length) throw new RangeError('Index out of range')
			}

			Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
				value = +value;
				offset = offset | 0;
				byteLength = byteLength | 0;
				if (!noAssert) {
					var maxBytes = Math.pow(2, 8 * byteLength) - 1;
					checkInt(this, value, offset, byteLength, maxBytes, 0)
				}

				var mul = 1;
				var i = 0;
				this[offset] = value & 0xFF;
				while (++i < byteLength && (mul *= 0x100)) {
					this[offset + i] = (value / mul) & 0xFF
				}

				return offset + byteLength
			};

			Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
				value = +value;
				offset = offset | 0;
				byteLength = byteLength | 0;
				if (!noAssert) {
					var maxBytes = Math.pow(2, 8 * byteLength) - 1;
					checkInt(this, value, offset, byteLength, maxBytes, 0)
				}

				var i = byteLength - 1;
				var mul = 1;
				this[offset + i] = value & 0xFF;
				while (--i >= 0 && (mul *= 0x100)) {
					this[offset + i] = (value / mul) & 0xFF
				}

				return offset + byteLength
			};

			Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
				value = +value;
				offset = offset | 0;
				if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
				if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
				this[offset] = (value & 0xff);
				return offset + 1
			};

			function objectWriteUInt16(buf, value, offset, littleEndian) {
				if (value < 0) value = 0xffff + value + 1;
				for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
					buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
						(littleEndian ? i : 1 - i) * 8
				}
			}

			Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
				value = +value;
				offset = offset | 0;
				if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
				if (Buffer.TYPED_ARRAY_SUPPORT) {
					this[offset] = (value & 0xff);
					this[offset + 1] = (value >>> 8)
				} else {
					objectWriteUInt16(this, value, offset, true)
				}
				return offset + 2
			};

			Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
				value = +value;
				offset = offset | 0;
				if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
				if (Buffer.TYPED_ARRAY_SUPPORT) {
					this[offset] = (value >>> 8);
					this[offset + 1] = (value & 0xff)
				} else {
					objectWriteUInt16(this, value, offset, false)
				}
				return offset + 2
			};

			function objectWriteUInt32(buf, value, offset, littleEndian) {
				if (value < 0) value = 0xffffffff + value + 1;
				for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
					buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
				}
			}

			Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
				value = +value;
				offset = offset | 0;
				if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
				if (Buffer.TYPED_ARRAY_SUPPORT) {
					this[offset + 3] = (value >>> 24);
					this[offset + 2] = (value >>> 16);
					this[offset + 1] = (value >>> 8);
					this[offset] = (value & 0xff)
				} else {
					objectWriteUInt32(this, value, offset, true)
				}
				return offset + 4
			};

			Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
				value = +value;
				offset = offset | 0;
				if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
				if (Buffer.TYPED_ARRAY_SUPPORT) {
					this[offset] = (value >>> 24);
					this[offset + 1] = (value >>> 16);
					this[offset + 2] = (value >>> 8);
					this[offset + 3] = (value & 0xff)
				} else {
					objectWriteUInt32(this, value, offset, false)
				}
				return offset + 4
			};

			Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
				value = +value;
				offset = offset | 0;
				if (!noAssert) {
					var limit = Math.pow(2, 8 * byteLength - 1);

					checkInt(this, value, offset, byteLength, limit - 1, -limit)
				}

				var i = 0;
				var mul = 1;
				var sub = 0;
				this[offset] = value & 0xFF;
				while (++i < byteLength && (mul *= 0x100)) {
					if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
						sub = 1
					}
					this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
				}

				return offset + byteLength
			};

			Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
				value = +value;
				offset = offset | 0;
				if (!noAssert) {
					var limit = Math.pow(2, 8 * byteLength - 1);

					checkInt(this, value, offset, byteLength, limit - 1, -limit)
				}

				var i = byteLength - 1;
				var mul = 1;
				var sub = 0;
				this[offset + i] = value & 0xFF;
				while (--i >= 0 && (mul *= 0x100)) {
					if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
						sub = 1
					}
					this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
				}

				return offset + byteLength
			};

			Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
				value = +value;
				offset = offset | 0;
				if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
				if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
				if (value < 0) value = 0xff + value + 1;
				this[offset] = (value & 0xff);
				return offset + 1
			};

			Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
				value = +value;
				offset = offset | 0;
				if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
				if (Buffer.TYPED_ARRAY_SUPPORT) {
					this[offset] = (value & 0xff);
					this[offset + 1] = (value >>> 8)
				} else {
					objectWriteUInt16(this, value, offset, true)
				}
				return offset + 2
			};

			Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
				value = +value;
				offset = offset | 0;
				if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
				if (Buffer.TYPED_ARRAY_SUPPORT) {
					this[offset] = (value >>> 8);
					this[offset + 1] = (value & 0xff)
				} else {
					objectWriteUInt16(this, value, offset, false)
				}
				return offset + 2
			};

			Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
				value = +value;
				offset = offset | 0;
				if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
				if (Buffer.TYPED_ARRAY_SUPPORT) {
					this[offset] = (value & 0xff);
					this[offset + 1] = (value >>> 8);
					this[offset + 2] = (value >>> 16);
					this[offset + 3] = (value >>> 24)
				} else {
					objectWriteUInt32(this, value, offset, true)
				}
				return offset + 4
			};

			Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
				value = +value;
				offset = offset | 0;
				if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
				if (value < 0) value = 0xffffffff + value + 1;
				if (Buffer.TYPED_ARRAY_SUPPORT) {
					this[offset] = (value >>> 24);
					this[offset + 1] = (value >>> 16);
					this[offset + 2] = (value >>> 8);
					this[offset + 3] = (value & 0xff)
				} else {
					objectWriteUInt32(this, value, offset, false)
				}
				return offset + 4
			};

			function checkIEEE754(buf, value, offset, ext, max, min) {
				if (offset + ext > buf.length) throw new RangeError('Index out of range');
				if (offset < 0) throw new RangeError('Index out of range')
			}

			function writeFloat(buf, value, offset, littleEndian, noAssert) {
				if (!noAssert) {
					checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
				}
				ieee754.write(buf, value, offset, littleEndian, 23, 4);
				return offset + 4
			}

			Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
				return writeFloat(this, value, offset, true, noAssert)
			};

			Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
				return writeFloat(this, value, offset, false, noAssert)
			};

			function writeDouble(buf, value, offset, littleEndian, noAssert) {
				if (!noAssert) {
					checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
				}
				ieee754.write(buf, value, offset, littleEndian, 52, 8);
				return offset + 8
			}

			Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
				return writeDouble(this, value, offset, true, noAssert)
			};

			Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
				return writeDouble(this, value, offset, false, noAssert)
			};

			// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
			Buffer.prototype.copy = function copy(target, targetStart, start, end) {
				if (!start) start = 0;
				if (!end && end !== 0) end = this.length;
				if (targetStart >= target.length) targetStart = target.length;
				if (!targetStart) targetStart = 0;
				if (end > 0 && end < start) end = start;

				// Copy 0 bytes; we're done
				if (end === start) return 0;
				if (target.length === 0 || this.length === 0) return 0;

				// Fatal error conditions
				if (targetStart < 0) {
					throw new RangeError('targetStart out of bounds')
				}
				if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds');
				if (end < 0) throw new RangeError('sourceEnd out of bounds');

				// Are we oob?
				if (end > this.length) end = this.length;
				if (target.length - targetStart < end - start) {
					end = target.length - targetStart + start
				}

				var len = end - start;
				var i;

				if (this === target && start < targetStart && targetStart < end) {
					// descending copy from end
					for (i = len - 1; i >= 0; --i) {
						target[i + targetStart] = this[i + start]
					}
				} else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
					// ascending copy from start
					for (i = 0; i < len; ++i) {
						target[i + targetStart] = this[i + start]
					}
				} else {
					Uint8Array.prototype.set.call(
						target,
						this.subarray(start, start + len),
						targetStart
					)
				}

				return len
			};

			// Usage:
			//    buffer.fill(number[, offset[, end]])
			//    buffer.fill(buffer[, offset[, end]])
			//    buffer.fill(string[, offset[, end]][, encoding])
			Buffer.prototype.fill = function fill(val, start, end, encoding) {
				// Handle string cases:
				if (typeof val === 'string') {
					if (typeof start === 'string') {
						encoding = start;
						start = 0;
						end = this.length
					} else if (typeof end === 'string') {
						encoding = end;
						end = this.length
					}
					if (val.length === 1) {
						var code = val.charCodeAt(0);
						if (code < 256) {
							val = code
						}
					}
					if (encoding !== undefined && typeof encoding !== 'string') {
						throw new TypeError('encoding must be a string')
					}
					if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
						throw new TypeError('Unknown encoding: ' + encoding)
					}
				} else if (typeof val === 'number') {
					val = val & 255
				}

				// Invalid ranges are not set to a default, so can range check early.
				if (start < 0 || this.length < start || this.length < end) {
					throw new RangeError('Out of range index')
				}

				if (end <= start) {
					return this
				}

				start = start >>> 0;
				end = end === undefined ? this.length : end >>> 0;

				if (!val) val = 0;

				var i;
				if (typeof val === 'number') {
					for (i = start; i < end; ++i) {
						this[i] = val
					}
				} else {
					var bytes = Buffer.isBuffer(val)
						? val
						: utf8ToBytes(new Buffer(val, encoding).toString());
					var len = bytes.length;
					for (i = 0; i < end - start; ++i) {
						this[i + start] = bytes[i % len]
					}
				}

				return this
			};

			// HELPER FUNCTIONS
			// ================

			var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

			function base64clean(str) {
				// Node strips out invalid characters like \n and \t from the string, base64-js does not
				str = stringtrim(str).replace(INVALID_BASE64_RE, '');
				// Node converts strings with length < 2 to ''
				if (str.length < 2) return '';
				// Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
				while (str.length % 4 !== 0) {
					str = str + '='
				}
				return str
			}

			function stringtrim(str) {
				if (str.trim) return str.trim();
				return str.replace(/^\s+|\s+$/g, '')
			}

			function toHex(n) {
				if (n < 16) return '0' + n.toString(16);
				return n.toString(16)
			}

			function utf8ToBytes(string, units) {
				units = units || Infinity;
				var codePoint;
				var length = string.length;
				var leadSurrogate = null;
				var bytes = [];

				for (var i = 0; i < length; ++i) {
					codePoint = string.charCodeAt(i);

					// is surrogate component
					if (codePoint > 0xD7FF && codePoint < 0xE000) {
						// last char was a lead
						if (!leadSurrogate) {
							// no lead yet
							if (codePoint > 0xDBFF) {
								// unexpected trail
								if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
								continue
							} else if (i + 1 === length) {
								// unpaired lead
								if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
								continue
							}

							// valid lead
							leadSurrogate = codePoint;

							continue
						}

						// 2 leads in a row
						if (codePoint < 0xDC00) {
							if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
							leadSurrogate = codePoint;
							continue
						}

						// valid surrogate pair
						codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
					} else if (leadSurrogate) {
						// valid bmp char, but last char was a lead
						if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
					}

					leadSurrogate = null;

					// encode utf8
					if (codePoint < 0x80) {
						if ((units -= 1) < 0) break;
						bytes.push(codePoint)
					} else if (codePoint < 0x800) {
						if ((units -= 2) < 0) break;
						bytes.push(
							codePoint >> 0x6 | 0xC0,
							codePoint & 0x3F | 0x80
						)
					} else if (codePoint < 0x10000) {
						if ((units -= 3) < 0) break;
						bytes.push(
							codePoint >> 0xC | 0xE0,
							codePoint >> 0x6 & 0x3F | 0x80,
							codePoint & 0x3F | 0x80
						)
					} else if (codePoint < 0x110000) {
						if ((units -= 4) < 0) break;
						bytes.push(
							codePoint >> 0x12 | 0xF0,
							codePoint >> 0xC & 0x3F | 0x80,
							codePoint >> 0x6 & 0x3F | 0x80,
							codePoint & 0x3F | 0x80
						)
					} else {
						throw new Error('Invalid code point')
					}
				}

				return bytes
			}

			function asciiToBytes(str) {
				var byteArray = [];
				for (var i = 0; i < str.length; ++i) {
					// Node's code seems to be doing this and not & 0x7F..
					byteArray.push(str.charCodeAt(i) & 0xFF)
				}
				return byteArray
			}

			function utf16leToBytes(str, units) {
				var c, hi, lo;
				var byteArray = [];
				for (var i = 0; i < str.length; ++i) {
					if ((units -= 2) < 0) break;

					c = str.charCodeAt(i);
					hi = c >> 8;
					lo = c % 256;
					byteArray.push(lo);
					byteArray.push(hi)
				}

				return byteArray
			}

			function base64ToBytes(str) {
				return base64.toByteArray(base64clean(str))
			}

			function blitBuffer(src, dst, offset, length) {
				for (var i = 0; i < length; ++i) {
					if ((i + offset >= dst.length) || (i >= src.length)) break;
					dst[i + offset] = src[i]
				}
				return i
			}

			function isnan(val) {
				return val !== val; // eslint-disable-line no-self-compare
			}

		}).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
	}, {"base64-js": 14, "ieee754": 15, "isarray": 16}],
	14: [function (require, module, exports) {
		'use strict';

		exports.toByteArray = toByteArray;
		exports.fromByteArray = fromByteArray;

		var lookup = [];
		var revLookup = [];
		var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;

		function init() {
			var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
			for (var i = 0, len = code.length; i < len; ++i) {
				lookup[i] = code[i];
				revLookup[code.charCodeAt(i)] = i
			}

			revLookup['-'.charCodeAt(0)] = 62;
			revLookup['_'.charCodeAt(0)] = 63
		}

		init();

		function toByteArray(b64) {
			var i, j, l, tmp, placeHolders, arr;
			var len = b64.length;

			if (len % 4 > 0) {
				throw new Error('Invalid string. Length must be a multiple of 4')
			}

			// the number of equal signs (place holders)
			// if there are two placeholders, than the two characters before it
			// represent one byte
			// if there is only one, then the three characters before it represent 2 bytes
			// this is just a cheap hack to not do indexOf twice
			placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;

			// base64 is 4/3 + up to two characters of the original data
			arr = new Arr(len * 3 / 4 - placeHolders);

			// if there are placeholders, only get up to the last complete 4 chars
			l = placeHolders > 0 ? len - 4 : len;

			var L = 0;

			for (i = 0, j = 0; i < l; i += 4, j += 3) {
				tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
				arr[L++] = (tmp >> 16) & 0xFF;
				arr[L++] = (tmp >> 8) & 0xFF;
				arr[L++] = tmp & 0xFF
			}

			if (placeHolders === 2) {
				tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
				arr[L++] = tmp & 0xFF
			} else if (placeHolders === 1) {
				tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
				arr[L++] = (tmp >> 8) & 0xFF;
				arr[L++] = tmp & 0xFF
			}

			return arr
		}

		function tripletToBase64(num) {
			return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
		}

		function encodeChunk(uint8, start, end) {
			var tmp;
			var output = [];
			for (var i = start; i < end; i += 3) {
				tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
				output.push(tripletToBase64(tmp))
			}
			return output.join('')
		}

		function fromByteArray(uint8) {
			var tmp;
			var len = uint8.length;
			var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
			var output = '';
			var parts = [];
			var maxChunkLength = 16383; // must be multiple of 3

			// go through the array every three bytes, we'll deal with trailing stuff later
			for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
				parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
			}

			// pad the end with zeros, but make sure to not forget the extra bytes
			if (extraBytes === 1) {
				tmp = uint8[len - 1];
				output += lookup[tmp >> 2];
				output += lookup[(tmp << 4) & 0x3F];
				output += '=='
			} else if (extraBytes === 2) {
				tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
				output += lookup[tmp >> 10];
				output += lookup[(tmp >> 4) & 0x3F];
				output += lookup[(tmp << 2) & 0x3F];
				output += '='
			}

			parts.push(output);

			return parts.join('')
		}

	}, {}],
	15: [function (require, module, exports) {
		exports.read = function (buffer, offset, isLE, mLen, nBytes) {
			var e, m;
			var eLen = nBytes * 8 - mLen - 1;
			var eMax = (1 << eLen) - 1;
			var eBias = eMax >> 1;
			var nBits = -7;
			var i = isLE ? (nBytes - 1) : 0;
			var d = isLE ? -1 : 1;
			var s = buffer[offset + i];

			i += d;

			e = s & ((1 << (-nBits)) - 1);
			s >>= (-nBits);
			nBits += eLen;
			for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

			m = e & ((1 << (-nBits)) - 1);
			e >>= (-nBits);
			nBits += mLen;
			for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

			if (e === 0) {
				e = 1 - eBias
			} else if (e === eMax) {
				return m ? NaN : ((s ? -1 : 1) * Infinity)
			} else {
				m = m + Math.pow(2, mLen);
				e = e - eBias
			}
			return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
		};

		exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
			var e, m, c;
			var eLen = nBytes * 8 - mLen - 1;
			var eMax = (1 << eLen) - 1;
			var eBias = eMax >> 1;
			var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
			var i = isLE ? 0 : (nBytes - 1);
			var d = isLE ? 1 : -1;
			var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

			value = Math.abs(value);

			if (isNaN(value) || value === Infinity) {
				m = isNaN(value) ? 1 : 0;
				e = eMax
			} else {
				e = Math.floor(Math.log(value) / Math.LN2);
				if (value * (c = Math.pow(2, -e)) < 1) {
					e--;
					c *= 2
				}
				if (e + eBias >= 1) {
					value += rt / c
				} else {
					value += rt * Math.pow(2, 1 - eBias)
				}
				if (value * c >= 2) {
					e++;
					c /= 2
				}

				if (e + eBias >= eMax) {
					m = 0;
					e = eMax
				} else if (e + eBias >= 1) {
					m = (value * c - 1) * Math.pow(2, mLen);
					e = e + eBias
				} else {
					m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
					e = 0
				}
			}

			for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

			e = (e << mLen) | m;
			eLen += mLen;
			for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

			buffer[offset + i - d] |= s * 128
		}

	}, {}],
	16: [function (require, module, exports) {
		var toString = {}.toString;

		module.exports = Array.isArray || function (arr) {
				return toString.call(arr) == '[object Array]';
			};

	}, {}],
	17: [function (require, module, exports) {
		// Copyright Joyent, Inc. and other Node contributors.
		//
		// Permission is hereby granted, free of charge, to any person obtaining a
		// copy of this software and associated documentation files (the
		// "Software"), to deal in the Software without restriction, including
		// without limitation the rights to use, copy, modify, merge, publish,
		// distribute, sublicense, and/or sell copies of the Software, and to permit
		// persons to whom the Software is furnished to do so, subject to the
		// following conditions:
		//
		// The above copyright notice and this permission notice shall be included
		// in all copies or substantial portions of the Software.
		//
		// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
		// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
		// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
		// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
		// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
		// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
		// USE OR OTHER DEALINGS IN THE SOFTWARE.

		function EventEmitter() {
			this._events = this._events || {};
			this._maxListeners = this._maxListeners || undefined;
		}

		module.exports = EventEmitter;

		// Backwards-compat with node 0.10.x
		EventEmitter.EventEmitter = EventEmitter;

		EventEmitter.prototype._events = undefined;
		EventEmitter.prototype._maxListeners = undefined;

		// By default EventEmitters will print a warning if more than 10 listeners are
		// added to it. This is a useful default which helps finding memory leaks.
		EventEmitter.defaultMaxListeners = 10;

		// Obviously not all Emitters should be limited to 10. This function allows
		// that to be increased. Set to zero for unlimited.
		EventEmitter.prototype.setMaxListeners = function (n) {
			if (!isNumber(n) || n < 0 || isNaN(n))
				throw TypeError('n must be a positive number');
			this._maxListeners = n;
			return this;
		};

		EventEmitter.prototype.emit = function (type) {
			var er, handler, len, args, i, listeners;

			if (!this._events)
				this._events = {};

			// If there is no 'error' event listener then throw.
			if (type === 'error') {
				if (!this._events.error ||
					(isObject(this._events.error) && !this._events.error.length)) {
					er = arguments[1];
					if (er instanceof Error) {
						throw er; // Unhandled 'error' event
					} else {
						// At least give some kind of context to the user
						var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
						err.context = er;
						throw err;
					}
				}
			}

			handler = this._events[type];

			if (isUndefined(handler))
				return false;

			if (isFunction(handler)) {
				switch (arguments.length) {
					// fast cases
					case 1:
						handler.call(this);
						break;
					case 2:
						handler.call(this, arguments[1]);
						break;
					case 3:
						handler.call(this, arguments[1], arguments[2]);
						break;
					// slower
					default:
						args = Array.prototype.slice.call(arguments, 1);
						handler.apply(this, args);
				}
			} else if (isObject(handler)) {
				args = Array.prototype.slice.call(arguments, 1);
				listeners = handler.slice();
				len = listeners.length;
				for (i = 0; i < len; i++)
					listeners[i].apply(this, args);
			}

			return true;
		};

		EventEmitter.prototype.addListener = function (type, listener) {
			var m;

			if (!isFunction(listener))
				throw TypeError('listener must be a function');

			if (!this._events)
				this._events = {};

			// To avoid recursion in the case that type === "newListener"! Before
			// adding it to the listeners, first emit "newListener".
			if (this._events.newListener)
				this.emit('newListener', type,
					isFunction(listener.listener) ?
						listener.listener : listener);

			if (!this._events[type])
			// Optimize the case of one listener. Don't need the extra array object.
				this._events[type] = listener;
			else if (isObject(this._events[type]))
			// If we've already got an array, just append.
				this._events[type].push(listener);
			else
			// Adding the second element, need to change to array.
				this._events[type] = [this._events[type], listener];

			// Check for listener leak
			if (isObject(this._events[type]) && !this._events[type].warned) {
				if (!isUndefined(this._maxListeners)) {
					m = this._maxListeners;
				} else {
					m = EventEmitter.defaultMaxListeners;
				}

				if (m && m > 0 && this._events[type].length > m) {
					this._events[type].warned = true;
					console.error('(node) warning: possible EventEmitter memory ' +
						'leak detected. %d listeners added. ' +
						'Use emitter.setMaxListeners() to increase limit.',
						this._events[type].length);
					if (typeof console.trace === 'function') {
						// not supported in IE 10
						console.trace();
					}
				}
			}

			return this;
		};

		EventEmitter.prototype.on = EventEmitter.prototype.addListener;

		EventEmitter.prototype.once = function (type, listener) {
			if (!isFunction(listener))
				throw TypeError('listener must be a function');

			var fired = false;

			function g() {
				this.removeListener(type, g);

				if (!fired) {
					fired = true;
					listener.apply(this, arguments);
				}
			}

			g.listener = listener;
			this.on(type, g);

			return this;
		};

		// emits a 'removeListener' event iff the listener was removed
		EventEmitter.prototype.removeListener = function (type, listener) {
			var list, position, length, i;

			if (!isFunction(listener))
				throw TypeError('listener must be a function');

			if (!this._events || !this._events[type])
				return this;

			list = this._events[type];
			length = list.length;
			position = -1;

			if (list === listener ||
				(isFunction(list.listener) && list.listener === listener)) {
				delete this._events[type];
				if (this._events.removeListener)
					this.emit('removeListener', type, listener);

			} else if (isObject(list)) {
				for (i = length; i-- > 0;) {
					if (list[i] === listener ||
						(list[i].listener && list[i].listener === listener)) {
						position = i;
						break;
					}
				}

				if (position < 0)
					return this;

				if (list.length === 1) {
					list.length = 0;
					delete this._events[type];
				} else {
					list.splice(position, 1);
				}

				if (this._events.removeListener)
					this.emit('removeListener', type, listener);
			}

			return this;
		};

		EventEmitter.prototype.removeAllListeners = function (type) {
			var key, listeners;

			if (!this._events)
				return this;

			// not listening for removeListener, no need to emit
			if (!this._events.removeListener) {
				if (arguments.length === 0)
					this._events = {};
				else if (this._events[type])
					delete this._events[type];
				return this;
			}

			// emit removeListener for all listeners on all events
			if (arguments.length === 0) {
				for (key in this._events) {
					if (key === 'removeListener') continue;
					this.removeAllListeners(key);
				}
				this.removeAllListeners('removeListener');
				this._events = {};
				return this;
			}

			listeners = this._events[type];

			if (isFunction(listeners)) {
				this.removeListener(type, listeners);
			} else if (listeners) {
				// LIFO order
				while (listeners.length)
					this.removeListener(type, listeners[listeners.length - 1]);
			}
			delete this._events[type];

			return this;
		};

		EventEmitter.prototype.listeners = function (type) {
			var ret;
			if (!this._events || !this._events[type])
				ret = [];
			else if (isFunction(this._events[type]))
				ret = [this._events[type]];
			else
				ret = this._events[type].slice();
			return ret;
		};

		EventEmitter.prototype.listenerCount = function (type) {
			if (this._events) {
				var evlistener = this._events[type];

				if (isFunction(evlistener))
					return 1;
				else if (evlistener)
					return evlistener.length;
			}
			return 0;
		};

		EventEmitter.listenerCount = function (emitter, type) {
			return emitter.listenerCount(type);
		};

		function isFunction(arg) {
			return typeof arg === 'function';
		}

		function isNumber(arg) {
			return typeof arg === 'number';
		}

		function isObject(arg) {
			return typeof arg === 'object' && arg !== null;
		}

		function isUndefined(arg) {
			return arg === void 0;
		}

	}, {}],
	18: [function (require, module, exports) {
		// shim for using process in browser
		var process = module.exports = {};

		// cached from whatever global is present so that test runners that stub it
		// don't break things.  But we need to wrap it in a try catch in case it is
		// wrapped in strict mode code which doesn't define any globals.  It's inside a
		// function because try/catches deoptimize in certain engines.

		var cachedSetTimeout;
		var cachedClearTimeout;

		function defaultSetTimout() {
			throw new Error('setTimeout has not been defined');
		}

		function defaultClearTimeout() {
			throw new Error('clearTimeout has not been defined');
		}

		(function () {
			try {
				if (typeof setTimeout === 'function') {
					cachedSetTimeout = setTimeout;
				} else {
					cachedSetTimeout = defaultSetTimout;
				}
			} catch (e) {
				cachedSetTimeout = defaultSetTimout;
			}
			try {
				if (typeof clearTimeout === 'function') {
					cachedClearTimeout = clearTimeout;
				} else {
					cachedClearTimeout = defaultClearTimeout;
				}
			} catch (e) {
				cachedClearTimeout = defaultClearTimeout;
			}
		}());
		function runTimeout(fun) {
			if (cachedSetTimeout === setTimeout) {
				//normal enviroments in sane situations
				return setTimeout(fun, 0);
			}
			// if setTimeout wasn't available but was latter defined
			if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
				cachedSetTimeout = setTimeout;
				return setTimeout(fun, 0);
			}
			try {
				// when when somebody has screwed with setTimeout but no I.E. maddness
				return cachedSetTimeout(fun, 0);
			} catch (e) {
				try {
					// When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
					return cachedSetTimeout.call(null, fun, 0);
				} catch (e) {
					// same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
					return cachedSetTimeout.call(this, fun, 0);
				}
			}

		}

		function runClearTimeout(marker) {
			if (cachedClearTimeout === clearTimeout) {
				//normal enviroments in sane situations
				return clearTimeout(marker);
			}
			// if clearTimeout wasn't available but was latter defined
			if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
				cachedClearTimeout = clearTimeout;
				return clearTimeout(marker);
			}
			try {
				// when when somebody has screwed with setTimeout but no I.E. maddness
				return cachedClearTimeout(marker);
			} catch (e) {
				try {
					// When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
					return cachedClearTimeout.call(null, marker);
				} catch (e) {
					// same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
					// Some versions of I.E. have different rules for clearTimeout vs setTimeout
					return cachedClearTimeout.call(this, marker);
				}
			}

		}

		var queue = [];
		var draining = false;
		var currentQueue;
		var queueIndex = -1;

		function cleanUpNextTick() {
			if (!draining || !currentQueue) {
				return;
			}
			draining = false;
			if (currentQueue.length) {
				queue = currentQueue.concat(queue);
			} else {
				queueIndex = -1;
			}
			if (queue.length) {
				drainQueue();
			}
		}

		function drainQueue() {
			if (draining) {
				return;
			}
			var timeout = runTimeout(cleanUpNextTick);
			draining = true;

			var len = queue.length;
			while (len) {
				currentQueue = queue;
				queue = [];
				while (++queueIndex < len) {
					if (currentQueue) {
						currentQueue[queueIndex].run();
					}
				}
				queueIndex = -1;
				len = queue.length;
			}
			currentQueue = null;
			draining = false;
			runClearTimeout(timeout);
		}

		process.nextTick = function (fun) {
			var args = new Array(arguments.length - 1);
			if (arguments.length > 1) {
				for (var i = 1; i < arguments.length; i++) {
					args[i - 1] = arguments[i];
				}
			}
			queue.push(new Item(fun, args));
			if (queue.length === 1 && !draining) {
				runTimeout(drainQueue);
			}
		};

		// v8 likes predictible objects
		function Item(fun, array) {
			this.fun = fun;
			this.array = array;
		}

		Item.prototype.run = function () {
			this.fun.apply(null, this.array);
		};
		process.title = 'browser';
		process.browser = true;
		process.env = {};
		process.argv = [];
		process.version = ''; // empty string to avoid regexp issues
		process.versions = {};

		function noop() {}

		process.on = noop;
		process.addListener = noop;
		process.once = noop;
		process.off = noop;
		process.removeListener = noop;
		process.removeAllListeners = noop;
		process.emit = noop;

		process.binding = function (name) {
			throw new Error('process.binding is not supported');
		};

		process.cwd = function () { return '/' };
		process.chdir = function (dir) {
			throw new Error('process.chdir is not supported');
		};
		process.umask = function () { return 0; };

	}, {}],
	19: [function (require, module, exports) {
		if (typeof Object.create === 'function') {
			// implementation from standard node.js 'util' module
			module.exports = function inherits(ctor, superCtor) {
				ctor.super_ = superCtor;
				ctor.prototype = Object.create(superCtor.prototype, {
					constructor: {
						value: ctor,
						enumerable: false,
						writable: true,
						configurable: true
					}
				});
			};
		} else {
			// old school shim for old browsers
			module.exports = function inherits(ctor, superCtor) {
				ctor.super_ = superCtor;
				var TempCtor = function () {};
				TempCtor.prototype = superCtor.prototype;
				ctor.prototype = new TempCtor();
				ctor.prototype.constructor = ctor
			}
		}

	}, {}],
	20: [function (require, module, exports) {
		module.exports = function isBuffer(arg) {
			return arg && typeof arg === 'object'
				&& typeof arg.copy === 'function'
				&& typeof arg.fill === 'function'
				&& typeof arg.readUInt8 === 'function';
		}
	}, {}],
	21: [function (require, module, exports) {
		(function (process, global) {
			// Copyright Joyent, Inc. and other Node contributors.
			//
			// Permission is hereby granted, free of charge, to any person obtaining a
			// copy of this software and associated documentation files (the
			// "Software"), to deal in the Software without restriction, including
			// without limitation the rights to use, copy, modify, merge, publish,
			// distribute, sublicense, and/or sell copies of the Software, and to permit
			// persons to whom the Software is furnished to do so, subject to the
			// following conditions:
			//
			// The above copyright notice and this permission notice shall be included
			// in all copies or substantial portions of the Software.
			//
			// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
			// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
			// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
			// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
			// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
			// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
			// USE OR OTHER DEALINGS IN THE SOFTWARE.

			var formatRegExp = /%[sdj%]/g;
			exports.format = function (f) {
				if (!isString(f)) {
					var objects = [];
					for (var i = 0; i < arguments.length; i++) {
						objects.push(inspect(arguments[i]));
					}
					return objects.join(' ');
				}

				var i = 1;
				var args = arguments;
				var len = args.length;
				var str = String(f).replace(formatRegExp, function (x) {
					if (x === '%%') return '%';
					if (i >= len) return x;
					switch (x) {
						case '%s':
							return String(args[i++]);
						case '%d':
							return Number(args[i++]);
						case '%j':
							try {
								return JSON.stringify(args[i++]);
							} catch (_) {
								return '[Circular]';
							}
						default:
							return x;
					}
				});
				for (var x = args[i]; i < len; x = args[++i]) {
					if (isNull(x) || !isObject(x)) {
						str += ' ' + x;
					} else {
						str += ' ' + inspect(x);
					}
				}
				return str;
			};

			// Mark that a method should not be used.
			// Returns a modified function which warns once by default.
			// If --no-deprecation is set, then it is a no-op.
			exports.deprecate = function (fn, msg) {
				// Allow for deprecating things in the process of starting up.
				if (isUndefined(global.process)) {
					return function () {
						return exports.deprecate(fn, msg).apply(this, arguments);
					};
				}

				if (process.noDeprecation === true) {
					return fn;
				}

				var warned = false;

				function deprecated() {
					if (!warned) {
						if (process.throwDeprecation) {
							throw new Error(msg);
						} else if (process.traceDeprecation) {
							console.trace(msg);
						} else {
							console.error(msg);
						}
						warned = true;
					}
					return fn.apply(this, arguments);
				}

				return deprecated;
			};

			var debugs = {};
			var debugEnviron;
			exports.debuglog = function (set) {
				if (isUndefined(debugEnviron))
					debugEnviron = process.env.NODE_DEBUG || '';
				set = set.toUpperCase();
				if (!debugs[set]) {
					if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
						var pid = process.pid;
						debugs[set] = function () {
							var msg = exports.format.apply(exports, arguments);
							console.error('%s %d: %s', set, pid, msg);
						};
					} else {
						debugs[set] = function () {};
					}
				}
				return debugs[set];
			};

			/**
			 * Echos the value of a value. Trys to print the value out
			 * in the best way possible given the different types.
			 *
			 * @param {Object} obj The object to print out.
			 * @param {Object} opts Optional options object that alters the output.
			 */
			/* legacy: obj, showHidden, depth, colors*/
			function inspect(obj, opts) {
				// default options
				var ctx = {
					seen: [],
					stylize: stylizeNoColor
				};
				// legacy...
				if (arguments.length >= 3) ctx.depth = arguments[2];
				if (arguments.length >= 4) ctx.colors = arguments[3];
				if (isBoolean(opts)) {
					// legacy...
					ctx.showHidden = opts;
				} else if (opts) {
					// got an "options" object
					exports._extend(ctx, opts);
				}
				// set default options
				if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
				if (isUndefined(ctx.depth)) ctx.depth = 2;
				if (isUndefined(ctx.colors)) ctx.colors = false;
				if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
				if (ctx.colors) ctx.stylize = stylizeWithColor;
				return formatValue(ctx, obj, ctx.depth);
			}

			exports.inspect = inspect;

			// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
			inspect.colors = {
				'bold': [1, 22],
				'italic': [3, 23],
				'underline': [4, 24],
				'inverse': [7, 27],
				'white': [37, 39],
				'grey': [90, 39],
				'black': [30, 39],
				'blue': [34, 39],
				'cyan': [36, 39],
				'green': [32, 39],
				'magenta': [35, 39],
				'red': [31, 39],
				'yellow': [33, 39]
			};

			// Don't use 'blue' not visible on cmd.exe
			inspect.styles = {
				'special': 'cyan',
				'number': 'yellow',
				'boolean': 'yellow',
				'undefined': 'grey',
				'null': 'bold',
				'string': 'green',
				'date': 'magenta',
				// "name": intentionally not styling
				'regexp': 'red'
			};

			function stylizeWithColor(str, styleType) {
				var style = inspect.styles[styleType];

				if (style) {
					return '\u001b[' + inspect.colors[style][0] + 'm' + str +
						'\u001b[' + inspect.colors[style][1] + 'm';
				} else {
					return str;
				}
			}

			function stylizeNoColor(str, styleType) {
				return str;
			}

			function arrayToHash(array) {
				var hash = {};

				array.forEach(function (val, idx) {
					hash[val] = true;
				});

				return hash;
			}

			function formatValue(ctx, value, recurseTimes) {
				// Provide a hook for user-specified inspect functions.
				// Check that value is an object with an inspect function on it
				if (ctx.customInspect &&
					value &&
					isFunction(value.inspect) &&
					// Filter out the util module, it's inspect function is special
					value.inspect !== exports.inspect &&
					// Also filter out any prototype objects using the circular check.
					!(value.constructor && value.constructor.prototype === value)) {
					var ret = value.inspect(recurseTimes, ctx);
					if (!isString(ret)) {
						ret = formatValue(ctx, ret, recurseTimes);
					}
					return ret;
				}

				// Primitive types cannot have properties
				var primitive = formatPrimitive(ctx, value);
				if (primitive) {
					return primitive;
				}

				// Look up the keys of the object.
				var keys = Object.keys(value);
				var visibleKeys = arrayToHash(keys);

				if (ctx.showHidden) {
					keys = Object.getOwnPropertyNames(value);
				}

				// IE doesn't make error fields non-enumerable
				// http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
				if (isError(value)
					&& (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
					return formatError(value);
				}

				// Some type of object without properties can be shortcutted.
				if (keys.length === 0) {
					if (isFunction(value)) {
						var name = value.name ? ': ' + value.name : '';
						return ctx.stylize('[Function' + name + ']', 'special');
					}
					if (isRegExp(value)) {
						return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
					}
					if (isDate(value)) {
						return ctx.stylize(Date.prototype.toString.call(value), 'date');
					}
					if (isError(value)) {
						return formatError(value);
					}
				}

				var base = '', array = false, braces = ['{', '}'];

				// Make Array say that they are Array
				if (isArray(value)) {
					array = true;
					braces = ['[', ']'];
				}

				// Make functions say that they are functions
				if (isFunction(value)) {
					var n = value.name ? ': ' + value.name : '';
					base = ' [Function' + n + ']';
				}

				// Make RegExps say that they are RegExps
				if (isRegExp(value)) {
					base = ' ' + RegExp.prototype.toString.call(value);
				}

				// Make dates with properties first say the date
				if (isDate(value)) {
					base = ' ' + Date.prototype.toUTCString.call(value);
				}

				// Make error with message first say the error
				if (isError(value)) {
					base = ' ' + formatError(value);
				}

				if (keys.length === 0 && (!array || value.length == 0)) {
					return braces[0] + base + braces[1];
				}

				if (recurseTimes < 0) {
					if (isRegExp(value)) {
						return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
					} else {
						return ctx.stylize('[Object]', 'special');
					}
				}

				ctx.seen.push(value);

				var output;
				if (array) {
					output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
				} else {
					output = keys.map(function (key) {
						return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
					});
				}

				ctx.seen.pop();

				return reduceToSingleString(output, base, braces);
			}

			function formatPrimitive(ctx, value) {
				if (isUndefined(value))
					return ctx.stylize('undefined', 'undefined');
				if (isString(value)) {
					var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
							.replace(/'/g, "\\'")
							.replace(/\\"/g, '"') + '\'';
					return ctx.stylize(simple, 'string');
				}
				if (isNumber(value))
					return ctx.stylize('' + value, 'number');
				if (isBoolean(value))
					return ctx.stylize('' + value, 'boolean');
				// For some reason typeof null is "object", so special case here.
				if (isNull(value))
					return ctx.stylize('null', 'null');
			}

			function formatError(value) {
				return '[' + Error.prototype.toString.call(value) + ']';
			}

			function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
				var output = [];
				for (var i = 0, l = value.length; i < l; ++i) {
					if (hasOwnProperty(value, String(i))) {
						output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
							String(i), true));
					} else {
						output.push('');
					}
				}
				keys.forEach(function (key) {
					if (!key.match(/^\d+$/)) {
						output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
							key, true));
					}
				});
				return output;
			}

			function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
				var name, str, desc;
				desc = Object.getOwnPropertyDescriptor(value, key) || {value: value[key]};
				if (desc.get) {
					if (desc.set) {
						str = ctx.stylize('[Getter/Setter]', 'special');
					} else {
						str = ctx.stylize('[Getter]', 'special');
					}
				} else {
					if (desc.set) {
						str = ctx.stylize('[Setter]', 'special');
					}
				}
				if (!hasOwnProperty(visibleKeys, key)) {
					name = '[' + key + ']';
				}
				if (!str) {
					if (ctx.seen.indexOf(desc.value) < 0) {
						if (isNull(recurseTimes)) {
							str = formatValue(ctx, desc.value, null);
						} else {
							str = formatValue(ctx, desc.value, recurseTimes - 1);
						}
						if (str.indexOf('\n') > -1) {
							if (array) {
								str = str.split('\n').map(function (line) {
									return '  ' + line;
								}).join('\n').substr(2);
							} else {
								str = '\n' + str.split('\n').map(function (line) {
										return '   ' + line;
									}).join('\n');
							}
						}
					} else {
						str = ctx.stylize('[Circular]', 'special');
					}
				}
				if (isUndefined(name)) {
					if (array && key.match(/^\d+$/)) {
						return str;
					}
					name = JSON.stringify('' + key);
					if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
						name = name.substr(1, name.length - 2);
						name = ctx.stylize(name, 'name');
					} else {
						name = name.replace(/'/g, "\\'")
							.replace(/\\"/g, '"')
							.replace(/(^"|"$)/g, "'");
						name = ctx.stylize(name, 'string');
					}
				}

				return name + ': ' + str;
			}

			function reduceToSingleString(output, base, braces) {
				var numLinesEst = 0;
				var length = output.reduce(function (prev, cur) {
					numLinesEst++;
					if (cur.indexOf('\n') >= 0) numLinesEst++;
					return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
				}, 0);

				if (length > 60) {
					return braces[0] +
						(base === '' ? '' : base + '\n ') +
						' ' +
						output.join(',\n  ') +
						' ' +
						braces[1];
				}

				return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
			}

			// NOTE: These type checking functions intentionally don't use `instanceof`
			// because it is fragile and can be easily faked with `Object.create()`.
			function isArray(ar) {
				return Array.isArray(ar);
			}

			exports.isArray = isArray;

			function isBoolean(arg) {
				return typeof arg === 'boolean';
			}

			exports.isBoolean = isBoolean;

			function isNull(arg) {
				return arg === null;
			}

			exports.isNull = isNull;

			function isNullOrUndefined(arg) {
				return arg == null;
			}

			exports.isNullOrUndefined = isNullOrUndefined;

			function isNumber(arg) {
				return typeof arg === 'number';
			}

			exports.isNumber = isNumber;

			function isString(arg) {
				return typeof arg === 'string';
			}

			exports.isString = isString;

			function isSymbol(arg) {
				return typeof arg === 'symbol';
			}

			exports.isSymbol = isSymbol;

			function isUndefined(arg) {
				return arg === void 0;
			}

			exports.isUndefined = isUndefined;

			function isRegExp(re) {
				return isObject(re) && objectToString(re) === '[object RegExp]';
			}

			exports.isRegExp = isRegExp;

			function isObject(arg) {
				return typeof arg === 'object' && arg !== null;
			}

			exports.isObject = isObject;

			function isDate(d) {
				return isObject(d) && objectToString(d) === '[object Date]';
			}

			exports.isDate = isDate;

			function isError(e) {
				return isObject(e) &&
					(objectToString(e) === '[object Error]' || e instanceof Error);
			}

			exports.isError = isError;

			function isFunction(arg) {
				return typeof arg === 'function';
			}

			exports.isFunction = isFunction;

			function isPrimitive(arg) {
				return arg === null ||
					typeof arg === 'boolean' ||
					typeof arg === 'number' ||
					typeof arg === 'string' ||
					typeof arg === 'symbol' ||  // ES6 symbol
					typeof arg === 'undefined';
			}

			exports.isPrimitive = isPrimitive;

			exports.isBuffer = require('./support/isBuffer');

			function objectToString(o) {
				return Object.prototype.toString.call(o);
			}

			function pad(n) {
				return n < 10 ? '0' + n.toString(10) : n.toString(10);
			}

			var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
				'Oct', 'Nov', 'Dec'];

			// 26 Feb 16:19:34
			function timestamp() {
				var d = new Date();
				var time = [pad(d.getHours()),
					pad(d.getMinutes()),
					pad(d.getSeconds())].join(':');
				return [d.getDate(), months[d.getMonth()], time].join(' ');
			}

			// log is just a thin wrapper to console.log that prepends a timestamp
			exports.log = function () {
				console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
			};

			/**
			 * Inherit the prototype methods from one constructor into another.
			 *
			 * The Function.prototype.inherits from lang.js rewritten as a standalone
			 * function (not on Function.prototype). NOTE: If this file is to be loaded
			 * during bootstrapping this function needs to be rewritten using some native
			 * functions as prototype setup using normal JavaScript does not work as
			 * expected during bootstrapping (see mirror.js in r114903).
			 *
			 * @param {function} ctor Constructor function which needs to inherit the
			 *     prototype.
			 * @param {function} superCtor Constructor function to inherit prototype from.
			 */
			exports.inherits = require('inherits');

			exports._extend = function (origin, add) {
				// Don't do anything if add isn't an object
				if (!add || !isObject(add)) return origin;

				var keys = Object.keys(add);
				var i = keys.length;
				while (i--) {
					origin[keys[i]] = add[keys[i]];
				}
				return origin;
			};

			function hasOwnProperty(obj, prop) {
				return Object.prototype.hasOwnProperty.call(obj, prop);
			}

		}).call(this, require('_process'), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
	}, {"./support/isBuffer": 20, "_process": 18, "inherits": 19}]
}, {}, [1]);
