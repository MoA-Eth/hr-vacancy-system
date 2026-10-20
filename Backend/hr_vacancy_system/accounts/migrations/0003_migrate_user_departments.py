from django.db import migrations


def get_or_create_department(Department, cache, raw_name):
    name = (raw_name or '').strip()
    if not name:
        return None
    key = name.lower()
    if key not in cache:
        department = Department.objects.filter(name__iexact=name).first()
        if department is None:
            department = Department.objects.create(name=name)
        cache[key] = department
    return cache[key]


def forwards(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    Department = apps.get_model('accounts', 'Department')
    cache = {}
    for user in User.objects.exclude(department='').exclude(department__isnull=True):
        department = get_or_create_department(Department, cache, user.department)
        if department is not None:
            user.department_ref = department
            user.save(update_fields=['department_ref'])


def backwards(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    for user in User.objects.select_related('department_ref').exclude(department_ref__isnull=True):
        user.department = user.department_ref.name
        user.save(update_fields=['department'])


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_department'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
