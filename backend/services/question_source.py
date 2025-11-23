from abc import ABC, abstractmethod
import os
import json
from typing import List, Optional, Dict, Any

class QuestionSource(ABC):
    @abstractmethod
    def get_subjects(self) -> List[str]:
        pass

    @abstractmethod
    def get_modules(self, subject: str) -> List[str]:
        pass

    @abstractmethod
    def get_questions(self, subject: str, module: str) -> List[Dict[str, Any]]:
        pass

class FileSystemSource(QuestionSource):
    def __init__(self, root_path: str):
        self.root_path = root_path

    def get_subjects(self) -> List[str]:
        if not os.path.exists(self.root_path):
            return []
        # List directories in root
        return [
            d for d in os.listdir(self.root_path)
            if os.path.isdir(os.path.join(self.root_path, d))
        ]

    def get_modules(self, subject: str) -> List[str]:
        subject_path = os.path.join(self.root_path, subject)
        if not os.path.exists(subject_path):
            return []
        # List directories in subject path
        return [
            d for d in os.listdir(subject_path)
            if os.path.isdir(os.path.join(subject_path, d))
        ]

    def get_questions(self, subject: str, module: str) -> List[Dict[str, Any]]:
        module_path = os.path.join(self.root_path, subject, module)
        json_path = os.path.join(module_path, "questions.json")

        if not os.path.exists(json_path):
            return []

        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Post-process to fix image paths
            for question in data:
                # Fix question_media_path
                if question.get("question_media_path"):
                    question["question_media_path"] = self._transform_media_path(
                        question["question_media_path"], subject, module
                    )

                # Fix explanation_elements
                if question.get("explanation_elements"):
                    for elem in question["explanation_elements"]:
                        if elem.get("type") == "image" and elem.get("path"):
                            elem["path"] = self._transform_media_path(
                                elem["path"], subject, module
                            )
            return data
        except Exception as e:
            print(f"Error reading questions for {subject}/{module}: {e}")
            return []

    def _transform_media_path(self, raw_path: str, subject: str, module: str) -> str:
        # Convert Windows backslashes to forward slashes
        clean_path = raw_path.replace("\\", "/")
        # Ideally, we return a relative URL that the frontend can use.
        # Since we mount the root folder at /static/library:
        # media\image.jpg -> /static/library/Subject/Module/media/image.jpg

        # Ensure we don't duplicate the module structure if it's already in the path (unlikely given description)
        # The description says "media\filename".

        return f"/static/library/{subject}/{module}/{clean_path}"
