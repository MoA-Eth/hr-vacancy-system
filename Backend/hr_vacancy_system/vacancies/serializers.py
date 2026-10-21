from rest_framework import serializers
from .models import Vacancy, Category, Project
from django.contrib.auth import get_user_model

User = get_user_model()


class CategorySerializer(serializers.ModelSerializer):
    vacancy_count = serializers.IntegerField(source='vacancies.count', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'is_active', 'vacancy_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProjectSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    vacancy_count = serializers.IntegerField(source='vacancies.count', read_only=True)

    class Meta:
        model = Project
        fields = ['id', 'name', 'description', 'department', 'department_name',
                  'is_active', 'vacancy_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class VacancyListSerializer(serializers.ModelSerializer):
    """Serializer for listing vacancies (lighter data)"""
    posted_by_name = serializers.CharField(source='posted_by.username', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    is_open = serializers.BooleanField(read_only=True)

    class Meta:
        model = Vacancy
        fields = [
            'id', 'title', 'department', 'department_name', 'location', 'employment_type',
            'workplace_type', 'experience_level', 'category', 'category_name',
            'project', 'project_name',
            'description', 'status', 'positions_available', 'deadline',
            'posted_by_name', 'is_open', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'posted_by_name', 'is_open']


class VacancyDetailSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating/viewing vacancy details"""
    posted_by_name = serializers.CharField(source='posted_by.username', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    application_count = serializers.SerializerMethodField()

    class Meta:
        model = Vacancy
        fields = [
            'id', 'title', 'department', 'department_name', 'location', 'employment_type',
            'workplace_type', 'experience_level', 'category', 'category_name',
            'project', 'project_name',
            'description', 'requirements', 'responsibilities',
            'min_salary', 'max_salary', 'positions_available', 'status',
            'deadline', 'posted_by', 'posted_by_name', 'application_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'posted_by', 'created_at', 'updated_at', 'posted_by_name']

    def get_application_count(self, obj):
        return obj.applications.count()

    def validate(self, data):
        min_sal = data.get('min_salary')
        max_sal = data.get('max_salary')
        if min_sal and max_sal and min_sal > max_sal:
            raise serializers.ValidationError({
                'min_salary': 'Minimum salary cannot be greater than maximum salary'
            })
        return data