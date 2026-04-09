import json
import os
import csv
from server import PromptServer
from aiohttp import web
from deep_translator import GoogleTranslator
 
TAGS_FILE = os.path.join(os.path.dirname(__file__), 'tags.json')
CSV_FILE = os.path.join(os.path.dirname(__file__), 'tags.csv')
 
# 启动时将 CSV 加载到内存中，避免每次悬停都读磁盘
translation_dict = {}
if os.path.exists(CSV_FILE):
    try:
        with open(CSV_FILE, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader, None)  # 跳过表头
            for row in reader:
                if len(row) >= 2:
                    translation_dict[row[0].strip().lower()] = row[1].strip()
    except Exception as e:
        print(f"[Prompt-AIO] 读取 CSV 翻译库失败: {e}")
 
@PromptServer.instance.routes.get("/prompt-all-in-one/get_tags")
async def get_tags(request):
    try:
        with open(TAGS_FILE, 'r', encoding='utf-8') as f:
            tags = json.load(f)
        return web.json_response(tags)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)
 
@PromptServer.instance.routes.get("/prompt-all-in-one/get_translations")
async def get_translations(request):
    return web.json_response(translation_dict)
 
@PromptServer.instance.routes.post("/prompt-all-in-one/add_tag")
async def add_tag(request):
    try:
        data = await request.json()
        category = data.get("category")
        word = data.get("word")
        
        if not category or not word:
            return web.json_response({"error": "分类和词汇不能为空"}, status=400)
 
        with open(TAGS_FILE, 'r+', encoding='utf-8') as f:
            tags = json.load(f)
            if category not in tags:
                tags[category] = []
            if word not in tags[category]:
                tags[category].append(word)
                f.seek(0)
                json.dump(tags, f, ensure_ascii=False, indent=4)
                f.truncate()
                
        return web.json_response({"success": True})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)
 
@PromptServer.instance.routes.get("/prompt-all-in-one/translate")
async def translate_text(request):
    text = request.query.get("text", "")
    if not text:
        return web.json_response({"translated": ""})
    try:
        translated = GoogleTranslator(source='auto', target='en').translate(text)
        return web.json_response({"translated": translated})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)