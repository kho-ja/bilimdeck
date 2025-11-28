from rest_framework import permissions, status, views
from rest_framework.response import Response
from .serializers import UserSerializer

class MeView(views.APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, format=None):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class PingView(views.APIView):
    permission_classes = (permissions.AllowAny,)
    def get(self, request):
        return Response({"status": "ok"})
