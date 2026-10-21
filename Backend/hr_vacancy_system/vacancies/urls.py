from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VacancyViewSet, CategoryViewSet, ProjectViewSet

router = DefaultRouter()
router.register(r'vacancies', VacancyViewSet, basename='vacancy')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'projects', ProjectViewSet, basename='project')

urlpatterns = [
    path('', include(router.urls)),
]