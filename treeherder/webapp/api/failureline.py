from rest_framework import viewsets
from rest_framework.decorators import (detail_route,
                                       list_route)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.reverse import reverse

from treeherder.model.derived import ArtifactsModel
from treeherder.model.models import (ClassifiedFailure,
                                     FailureLine,
                                     FailureMatch,
                                     Matcher)
from treeherder.webapp.api import (permissions,
                                   serializers)
from treeherder.webapp.api.permissions import IsStaffOrReadOnly
from treeherder.webapp.api.utils import (UrlQueryFilter,
                                         get_option,
                                         with_jobs)

class FailureLineViewSet(viewsets.ViewSet):
    queryset = FailureLine.objects.all()
    serializer_class = serializers.FailureLineNoStackSerializer

    def retrieve(self, request, pk=None):
        """
        Get a single test failure line
        """
        try:
            failure_line = FailureLine.objects.prefetch_related(
                "matches", "matches__matcher",
            ).get(
                id=pk
            )
            return Response(serializers.FailureLineNoStackSerializer(failure_line).data)
        except FailureLine.DoesNotExist:
            return Response("No job with id: {0}".format(pk), 404)

    def update(self, request, pk=None):
        try:
            failure_line = FailureLine.objects.prefetch_related('classified_failures').get(id=pk)
        except FailureLine.DoesNotExist:
            return Response("No job with id: {0}".format(pk), 404)

        classification_id = request.data.get("best_classification", None)
        if not classification_id:
            return Response("No classification id provided", 400)

        try:
            classification = ClassifiedFailure.objects.get(id=classification_id)
            print classification
        except ClassifiedFailure.DoesNotExist:
            return Response("No classification with id: {0}".format(classification_id), 404)

        failure_line.best_classification = classification
        failure_line.best_is_verified = True

        failure_line.save()

        if classification not in failure_line.classified_failures.all():
            manual_detector = Matcher.objects.get(name="ManualDetector")
            match = FailureMatch(failure_line=failure_line,
                                 classified_failure=classification,
                                 matcher=manual_detector,
                                 score=1.0)
            match.save()
            # Force failure line to be reloaded, including .classified_failures
            failure_line = FailureLine.objects.prefetch_related('classified_failures').get(id=pk)

        return Response(serializers.FailureLineNoStackSerializer(failure_line).data)
