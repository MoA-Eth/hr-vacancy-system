from django.db import migrations

UNASSIGNED_DEPARTMENT = 'Unassigned'


def forwards(apps, schema_editor):
    Vacancy = apps.get_model('vacancies', 'Vacancy')
    Department = apps.get_model('accounts', 'Department')
    cache = {}
    for vacancy in Vacancy.objects.all():
        name = (vacancy.department or '').strip() or UNASSIGNED_DEPARTMENT
        key = name.lower()
        if key not in cache:
            department = Department.objects.filter(name__iexact=name).first()
            if department is None:
                department = Department.objects.create(name=name)
            cache[key] = department
        vacancy.department_ref = cache[key]
        vacancy.save(update_fields=['department_ref'])


def backwards(apps, schema_editor):
    Vacancy = apps.get_model('vacancies', 'Vacancy')
    for vacancy in Vacancy.objects.select_related('department_ref').exclude(department_ref__isnull=True):
        vacancy.department = vacancy.department_ref.name
        vacancy.save(update_fields=['department'])


class Migration(migrations.Migration):

    dependencies = [
        ('vacancies', '0004_vacancy_department_ref'),
        ('accounts', '0003_migrate_user_departments'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
