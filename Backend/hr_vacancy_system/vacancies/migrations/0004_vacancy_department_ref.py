from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('vacancies', '0003_vacancy_category_vacancy_experience_level_and_more'),
        ('accounts', '0002_department'),
    ]

    operations = [
        migrations.RemoveIndex(
            model_name='vacancy',
            name='vacancies_v_departm_a51d98_idx',
        ),
        migrations.AddField(
            model_name='vacancy',
            name='department_ref',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='vacancies',
                to='accounts.department',
            ),
        ),
    ]
