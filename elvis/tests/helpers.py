from django.conf import settings
from django.contrib.auth.models import User
from django.test import Client
from model_mommy import mommy


class ElvisTestSetup(object):
    def url(self, obj):
        model_name = obj.__class__.__name__.lower()
        return "http://localhost:8000/{0}/{1}".format(model_name, obj.id)

    def setUp_elvis(self):
        self.client = Client()

    def setUp_test_models(self):
        self.test_composer = mommy.make('elvis.Composer')
        self.test_piece = mommy.make('elvis.Piece', composer=self.test_composer, uploader=self.creator_user)
        self.test_movement = mommy.make('elvis.Movement', composer=self.test_composer, uploader=self.creator_user)
        self.test_collection = mommy.make('elvis.Collection', public=True)
        self.test_private_collection = mommy.make('elvis.Collection', public=False, creator=self.creator_user)

    def setUp_user(self):
        self.test_user = User.objects.create_user(username='testuser', password='test')
        self.creator_user = User.objects.create_user(username='creatoruser', password='test')
        self.super_user = User.objects.create_superuser(username='superuser', email='a@g.com', password='test')