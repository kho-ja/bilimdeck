from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_deckparticipant'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CardReview',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('last_rating', models.CharField(blank=True, choices=[('again', 'Again'), ('hard', 'Hard'), ('easy', 'Easy')], max_length=10, null=True)),
                ('last_reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('next_due_at', models.DateTimeField(blank=True, db_index=True, null=True)),
                ('interval_days', models.IntegerField(default=0)),
                ('ease_factor', models.FloatField(default=2.5)),
                ('card', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='card_reviews', to='api.card')),
                ('deck', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='card_reviews', to='api.deck')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='card_reviews', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['next_due_at', 'id'],
                'unique_together': {('user', 'card')},
            },
        ),
        migrations.CreateModel(
            name='StudyEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('rating', models.CharField(choices=[('again', 'Again'), ('hard', 'Hard'), ('easy', 'Easy')], max_length=10)),
                ('duration_seconds', models.IntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('card', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='study_events', to='api.card')),
                ('deck', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='study_events', to='api.deck')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='study_events', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
