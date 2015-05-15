from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from rest_framework import generics
from rest_framework import permissions
from rest_framework.renderers import JSONRenderer

from elvis.serializers.user import UserSerializer
from elvis.renderers.custom_html_renderer import CustomHTMLRenderer
from elvis.forms import UserForm, UserUpdateForm
from django.http import HttpResponse, HttpResponseRedirect

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect

from django.shortcuts import render

class UserListHTMLRenderer(CustomHTMLRenderer):
    template_name = "user/user_list.html"


class UserDetailHTMLRenderer(CustomHTMLRenderer):
    template_name = "user/user_detail.html"

class UserAccountHTMLRenderer(CustomHTMLRenderer):
    template_name = "user/user_account.html"


class UserList(generics.ListCreateAPIView):
    model = User
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = UserSerializer
    renderer_classes = (JSONRenderer, UserListHTMLRenderer)
    paginate_by = 10
    paginate_by_param = 'page_size'
    max_paginate_by = 100


class UserDetail(generics.RetrieveUpdateDestroyAPIView):
    model = User
    permission_classes = (permissions.IsAuthenticatedOrReadOnly,)
    serializer_class = UserSerializer
    renderer_classes = (JSONRenderer, UserDetailHTMLRenderer)


class UserAccount(generics.CreateAPIView):
    model = User
    serializer_class = UserSerializer
    renderer_classes = (JSONRenderer, UserAccountHTMLRenderer)
    
    def get(self, request, *args, **kwargs):
        return render(request, "user/user_account.html")
            
    @method_decorator(csrf_protect)
    def post(self, request, *args, **kwargs):
        user = request.user
        if user.is_anonymous():
            form = UserForm(data=request.POST)
            if form.is_valid():
                user = form.save()        
                user = authenticate(username=request.POST['username'], password=request.POST['password1'])
                login(request, user)
                return HttpResponseRedirect("/")
        else:
            form = UserUpdateForm(data=request.POST, instance=request.user)
            if form.is_valid():
                user = form.save()
            print form
        return render(request, "user/user_account.html", {'form': form})

