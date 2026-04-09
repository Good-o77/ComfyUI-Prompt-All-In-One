class PromptAllInOneNode:
    @classmethod
    def INPUT_TYPES(s):
        return {"required": {"prompt": ("STRING", {"multiline": True, "default": ""})}}
    
    RETURN_TYPES = ("STRING",)
    FUNCTION = "execute"
    CATEGORY = "Prompt All-In-One"
    
    def execute(self, prompt):
        return (prompt,)
 
NODE_CLASS_MAPPINGS = {
    "PromptAllInOne": PromptAllInOneNode
}
 
NODE_DISPLAY_NAME_MAPPINGS = {
    "PromptAllInOne": "Prompt All-In-One"
}