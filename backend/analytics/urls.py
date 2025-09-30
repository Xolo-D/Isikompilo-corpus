# analytics/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('word-frequency/', views.word_frequency, name='word-frequency'),
    path('corpus-stats/', views.corpus_statistics, name='corpus-stats'),
    path('usage-stats/', views.usage_statistics, name='usage-stats'),
    path('dashboard/', views.analytics_dashboard, name='analytics-dashboard'),
]