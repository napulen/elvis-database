from elvis.views.main import TOSPage


class ElvisTermsOfServiceMiddleware:
    # A set of paths prefixes that don't need to be protected by TOS.
    UNPROTECTED_PATHS = {'/logout'}

    def process_view(self, request, view_func, view_args, view_kwarg):
        """Redirect request to TOS page if user has not accepted yet."""
        user = request.user
        if self._should_redirect(request, user):
            return TOSPage.as_view()(request, *view_args, **view_kwarg)
        else:
            return None

    def _should_redirect(self, request, user):
        """Figure out if user should be redirected to TOS screen."""
        if request.method != "GET" or user.is_anonymous() or \
                any(request.path.startswith(p) for p in self.UNPROTECTED_PATHS):
            return False

        # Use the session to store a bool concerning TOS acceptance.
        # Avoid doing a DB lookup on every request.
        accepted_tos = request.session.get("ACCEPTED_TOS")
        if accepted_tos is None:
            accepted_tos = user.userprofile.accepted_tos
            request.session['ACCEPTED_TOS'] = accepted_tos

        if accepted_tos:
            return False
        else:
            return True
