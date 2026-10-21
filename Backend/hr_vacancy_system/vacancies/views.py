from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from .models import Vacancy, Category, Project
from .serializers import VacancyListSerializer, VacancyDetailSerializer, CategorySerializer, ProjectSerializer
from accounts.permissions import IsAdminOrRecruiter, CanManageVacancy
from accounts.permissions import IsAdminUser


class VacancyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing vacancies
    - List: GET /api/vacancies/
    - Retrieve: GET /api/vacancies/{id}/
    - Create: POST /api/vacancies/
    - Update: PUT /api/vacancies/{id}/
    - Partial Update: PATCH /api/vacancies/{id}/
    - Delete: DELETE /api/vacancies/{id}/
    """
    queryset = Vacancy.objects.select_related('department', 'posted_by', 'category', 'project').all()
    permission_classes = [IsAdminOrRecruiter]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'department', 'employment_type', 'category', 'project']
    search_fields = ['title', 'description', 'requirements']
    ordering_fields = ['created_at', 'deadline', 'title']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Filter vacancies based on user role:
        - Admins: See all vacancies
        - Recruiters: See only their department's vacancies
        """
        queryset = super().get_queryset()
        user = self.request.user
        
        # Skip filtering for public endpoints
        if self.action in ['public_list', 'public_detail']:
            return queryset
        
        # Admins see all vacancies
        if user.role == 'admin':
            return queryset
        
        # Recruiters see only their department's vacancies (none if unassigned)
        if user.role == 'recruiter':
            return queryset.filter(department_id=user.department_id)
        
        # Interviewers see all (they need to see vacancies for interviews)
        return queryset
    
    def get_serializer_class(self):
        """Use different serializers for list vs detail views"""
        if self.action == 'list':
            return VacancyListSerializer
        return VacancyDetailSerializer
    
    def get_permissions(self):
        """Allow anyone to view public vacancies, but require auth for modifications"""
        if self.action in ['public_list', 'public_detail']:
            return [AllowAny()]
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOrRecruiter()]
        return [IsAuthenticated()]
    
    def _recruiter_department(self):
        """Return the recruiter's department, or None for non-recruiters"""
        user = self.request.user
        if user.role != 'recruiter':
            return None
        if not user.department_id:
            raise ValidationError({'department': 'You are not assigned to a department. Contact an administrator.'})
        return user.department

    def perform_create(self, serializer):
        """Auto-set posted_by; recruiters always post to their own department"""
        department = self._recruiter_department()
        if department is not None:
            serializer.save(posted_by=self.request.user, department=department)
        else:
            serializer.save(posted_by=self.request.user)

    def perform_update(self, serializer):
        """Recruiters cannot move a vacancy to another department"""
        department = self._recruiter_department()
        if department is not None:
            serializer.save(department=department)
        else:
            serializer.save()
        
    def check_object_permissions(self, request, obj):
        """Check object-level permissions for update/delete"""
        for permission in [CanManageVacancy()]:
            if not permission.has_object_permission(request, self, obj):
                self.permission_denied(
                    request,
                    message=getattr(permission, 'message', None),
                    code=getattr(permission, 'code', None)
                )
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public_list(self, request):
        """Public endpoint for job seekers to view open vacancies"""
        from django.utils import timezone
        # Filter by status='open' AND deadline hasn't passed
        vacancies = self.queryset.filter(
            status='open',
            deadline__gte=timezone.now().date()
        )
        serializer = VacancyListSerializer(vacancies, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def public_detail(self, request, pk=None):
        """Public endpoint to view a single open vacancy"""
        from django.utils import timezone
        try:
            vacancy = self.queryset.get(
                pk=pk,
                status='open',
                deadline__gte=timezone.now().date()
            )
            serializer = VacancyDetailSerializer(vacancy)
            return Response(serializer.data)
        except Vacancy.DoesNotExist:
            return Response(
                {'error': 'Vacancy not found, not open, or deadline has passed'},
                status=status.HTTP_404_NOT_FOUND
            )


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing job categories.
    - Read: Any authenticated user
    - Write (create/update/delete): Admin only
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing projects.
    - Read: Any authenticated user
    - Write (create/update/delete): Admin only
    """
    queryset = Project.objects.select_related('department').all()
    serializer_class = ProjectSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]