"""
Question Source Service.

This module defines the interface and implementation for retrieving quiz questions
and organization structure (subjects, modules) from a storage backend.
Currently, it supports a file-system-based approach.
"""

from abc import ABC, abstractmethod
import os
import json
from typing import List, Optional, Dict, Any

class QuestionSource(ABC):
    """
    Abstract base class defining the interface for data retrieval.
    """

    @abstractmethod
    def get_subjects(self) -> List[str]:
        """
        Retrieves a list of available subjects.

        Returns:
            List[str]: A list of subject names.
        """
        pass

    @abstractmethod
    def get_modules(self, subject: str) -> List[str]:
        """
        Retrieves a list of modules for a specific subject.

        Args:
            subject (str): The name of the subject.

        Returns:
            List[str]: A list of module names associated with the subject.
        """
        pass

    @abstractmethod
    def get_questions(self, subject: str, module: str) -> List[Dict[str, Any]]:
        """
        Retrieves the list of questions for a specific module.

        Args:
            subject (str): The subject name.
            module (str): The module name.

        Returns:
            List[Dict[str, Any]]: A list of question dictionaries.
        """
        pass

class FileSystemSource(QuestionSource):
    """
    Implementation of QuestionSource that reads from a local directory structure.

    The expected structure is:
    Root/
      Subject/
        Module/
          questions.json
          media/
    """

    def __init__(self, root_path: str):
        """
        Initializes the FileSystemSource.

        Args:
            root_path (str): The absolute or relative path to the root directory
                             containing the question bank.
        """
        self.root_path = root_path

    def get_subjects(self) -> List[str]:
        """
        Scans the root directory for subject folders.

        Returns:
            List[str]: A list of directory names in the root folder.
                       Returns an empty list if the root path does not exist.
        """
        if not os.path.exists(self.root_path):
            return []
        # List directories in root
        return [
            d for d in os.listdir(self.root_path)
            if os.path.isdir(os.path.join(self.root_path, d))
        ]

    def get_modules(self, subject: str) -> List[str]:
        """
        Scans the subject directory for module folders.

        Args:
            subject (str): The name of the subject directory.

        Returns:
            List[str]: A list of directory names within the subject folder.
                       Returns an empty list if the subject directory does not exist.
        """
        subject_path = os.path.join(self.root_path, subject)
        if not os.path.exists(subject_path):
            return []
        # List directories in subject path
        return [
            d for d in os.listdir(subject_path)
            if os.path.isdir(os.path.join(subject_path, d))
        ]

    def get_questions(self, subject: str, module: str) -> List[Dict[str, Any]]:
        """
        Reads and parses the 'questions.json' file within a module directory.

        This method also normalizes image paths found in the JSON data to be
        accessible via the web server.

        Args:
            subject (str): The subject name.
            module (str): The module name.

        Returns:
            List[Dict[str, Any]]: A list of question objects. Returns an empty list
                                  if the file is missing or invalid.
        """
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
        """
        Transforms a local file path into a web-accessible URL path.

        Converts Windows-style backslashes to forward slashes and prepends
        the static library prefix.

        Args:
            raw_path (str): The raw path from the JSON (e.g., "media\\image.jpg").
            subject (str): The subject name.
            module (str): The module name.

        Returns:
            str: A URL path string (e.g., "/static/library/Subject/Module/media/image.jpg").
        """
        # Convert Windows backslashes to forward slashes
        clean_path = raw_path.replace("\\", "/")
        # Ideally, we return a relative URL that the frontend can use.
        # Since we mount the root folder at /static/library:
        # media\image.jpg -> /static/library/Subject/Module/media/image.jpg

        # Ensure we don't duplicate the module structure if it's already in the path (unlikely given description)
        # The description says "media\filename".

        return f"/static/library/{subject}/{module}/{clean_path}"
