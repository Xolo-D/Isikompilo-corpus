# corpus/apps.py
from django.apps import AppConfig

class CorpusConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'corpus'
    verbose_name = 'Cultural Corpus'