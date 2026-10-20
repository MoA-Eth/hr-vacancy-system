from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_migrate_user_departments'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='user',
            name='department',
        ),
        migrations.RenameField(
            model_name='user',
            old_name='department_ref',
            new_name='department',
        ),
    ]
