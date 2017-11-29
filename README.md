# 游戏机器人说明：

/games 包含了777、汉堡、海盗、西游记四个游戏的机器人

机器人的架构：robot -> robotAction -> memory
                                 -> net

robotAction定义了所以动作，并调用net进行网络请求实现这些动作
memory存储了robot所有临时变量
不同的机器人通过覆盖robotAction中的部分方法，实现自己独有的动作

# 管理机器人说明：

/managerRobot 包含了管理机器人，架构与游戏机器人相同，管理机器人可智能添加游戏机器人进入游戏
添加机器人策略可在valveRobotAction的detectRoomInfo方法中更改，其实写成配置文件更好，懒得做了

# 配置：
/config:
game-config.json 配置服务器
