from rest_framework.test import APITestCase
from rest_framework import status
from model_mommy import mommy
from elvis.tests.helpers import ElvisTestSetup, real_user, creator_user
from elvis.models.movement import Movement


class MovementViewTestCase(ElvisTestSetup, APITestCase):

    def setUp(self):
        self.setUp_users()
        self.setUp_test_models()

    def test_get_list(self):
        response = self.client.get("/movements/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_detail(self):
        movement = Movement.objects.first()
        response = self.client.get("/movement/{0}/".format(movement.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['uuid'], str(movement.uuid))

    def test_get_hidden_detail(self):
        movement = Movement.objects.filter(hidden=True)[0]
        self.client.login(username=real_user['username'], password='test')
        response = self.client.get("/movement/{0}/".format(movement.id))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.client.logout()

        self.client.login(username=creator_user['username'], password='test')
        response = self.client.get("/movement/{0}/".format(movement.id))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], movement.id)
        self.client.logout()
