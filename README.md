# ComfyUI-Prompt-All-In-One
尝试ai借鉴优秀项目开发的一个插件，欢迎大家一起更新|Attempting an AI plugin inspired by the development of outstanding projects. Everyone is welcome to contribute to updates.

	这是一个为 [ComfyUI](https://github.com/comfyanonymous/ComfyUI) 量身定制的提示词辅助插件。本项目从 [sd-webui-prompt-all-in-one](https://github.com/Physton/sd-webui-prompt-all-in-one) 中汲取灵感，剥离了深度绑定 SD WebUI 的逻辑，去除了 LoRA 等不适用的功能，针对 ComfyUI 的工作流特性重新开发了前端交互与后端逻辑。
	## ✨ 核心功能
	- **📝 提示词工作台**：在 ComfyUI 界面右侧提供浮动面板，不遮挡画布操作，随开随用。
	- **🌐 在线中文翻译**：输入中文提示词或长句，一键调用 Google 翻译转为英文，并自动追加到当前选中的节点。
	- **💡 本地悬停翻译**：基于本地 CSV 字典，鼠标悬停在词库标签或当前节点的可视化标签上，自动浮现中文释义气泡，即扫即懂。
	- **🏷️ 可折叠分类词库**：内置分类词库（画质、风格、人物等），支持手风琴式折叠/展开，点击标签一键追加。支持**动态添加标签**并永久保存。
	- **👁️ 可视化标签编辑**：将冗长的提示词字符串拆分为独立的可视化标签卡片，支持一键删除特定提示词，告别手动修改长文本的烦恼。
	## 📦 插件文件结构
	```text
	comfyui-prompt-all-in-one/
	├── __init__.py               # ComfyUI 后端入口，注册节点与 API
	├── nodes.py                  # ComfyUI 节点定义
	├── api.py                    # 后端 API：在线翻译、词库与字典读取
	├── tags.json                 # 提示词分类词库 (支持界面动态写入)
	├── tags.csv                  # 本地英中翻译字典 (用于悬停提示)
	├── requirements.txt          # Python 依赖
	└── javascript/
	    └── prompt_all_in_one.js  # ComfyUI 前端 UI：侧边栏与交互逻辑
页面长这样：
<img width="1148" height="859" alt="项目图片" src="https://github.com/user-attachments/assets/2c746063-067c-470c-820e-bd064a98a933" />

      安装方法
方法一：通过 ComfyUI Manager 安装 (推荐)
如果你安装了 ComfyUI Manager，可以直接在 Manager 中搜索 ComfyUI-Prompt-All-In-One 进行安装。

方法二：手动安装
进入 ComfyUI 的自定义节点目录：
cd ComfyUI/custom_nodes/

克隆本仓库：
git clone https://github.com/你的用户名/ComfyUI-Prompt-All-In-One.git

安装 Python 依赖：
在便携版 ComfyUI根目录：
.\python_embeded\python.exe -m pip install -r .\ComfyUI-Prompt-All-In-One\requirements.txt

独立环境 ComfyUI:
pip install -r ComfyUI-Prompt-All-In-One/requirements.txt

重启 ComfyUI。
🎮 使用说明
启动 ComfyUI 后，在网页界面的右上角找到 📝 提示词工作台 按钮。
点击按钮展开侧边栏。
选中画布上的 CLIP Text Encode 节点。
在线翻译：在顶部输入框输入中文，按回车或点击按钮，英文将自动追加到节点中。
分类词库：展开对应分类，点击标签直接追加；点击分类旁的 + 添加 按钮，可向该分类动态添加新词汇。
悬停翻译：将鼠标悬停在词库标签或下方的可视化标签上，即可查看对应的中文释义。
可视化编辑：点击“🔄刷新”，当前节点的提示词会变成卡片，点击红色的 × 即可删除该词。
⚙️ 自定义配置
1. 自定义分类词库 (tags.json)
你可以直接编辑项目目录下的 tags.json 文件来添加你自己的提示词分类和词组，格式如下：

{
  "新分类名称": ["提示词1", "提示词2", "提示词3"]
}
提示：你也可以直接在界面上通过“+ 添加”按钮动态添加，插件会自动更新此文件。

2. 自定义本地翻译字典 (tags.csv)
插件通过读取 tags.csv 实现悬停翻译。你可以使用 Excel 或记事本编辑它，格式要求：第一列为英文，第二列为中文，必须保留首行表头。

Excel/WPS 编辑方式：
A列 (英文)	B列 (中文)
english	chinese
masterpiece	杰作
best quality	最佳品质

记事本打开样式：
english,chinese
masterpiece,杰作
best quality,最佳品质

注意：请勿将中英文写在同一列内用逗号隔开，必须分为两列。

🙏 致谢
Physton/sd-webui-prompt-all-in-one：提供了优秀的设计灵感。
