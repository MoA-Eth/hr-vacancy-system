from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('vacancies', '0005_migrate_vacancy_departments'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='vacancy',
            name='department',
        ),
        migrations.RenameField(
            model_name='vacancy',
            old_name='department_ref',
            new_name='department',
        ),
        migrations.AlterField(
            model_name='vacancy',
            name='department',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                related_name='vacancies',
                to='accounts.department',
            ),
        ),
    ]
