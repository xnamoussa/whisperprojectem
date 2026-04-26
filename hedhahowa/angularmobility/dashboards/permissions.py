from rest_framework.permissions import BasePermission


class IsSameMinistry(BasePermission):
    def has_permission(self, request, view):
        requested_ministry = view.kwargs.get("ministry")
        return bool(
            request.user
            and request.user.is_authenticated
            and requested_ministry == request.user.ministry
        )
