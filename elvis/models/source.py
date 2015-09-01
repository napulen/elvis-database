from django.db import models
from django.dispatch import receiver
from django.db.models.signals import post_save, post_delete
from elvis.models.main import ElvisModel


class Source(ElvisModel):
    class Meta:
        ordering = ["title"]
        app_label = "elvis"


@receiver(post_save, sender=Source)
def solr_index(sender, instance, created, **kwargs):
    if kwargs.get('raw', False):
        return False

    import uuid
    import solr
    from django.conf import settings

    solrconn = solr.SolrConnection(settings.SOLR_SERVER)
    record = solrconn.query("item_id:{0} AND type:elvis_source".format(instance.id))
    if record:
        solrconn.delete(record.results[0]['id'])

    source = instance
    d = {'type': 'elvis_source',
         'id': str(uuid.uuid4()),
         'item_id': int(source.id),
         'title': source.name,
         'sources_searchable': source.name,
         'created': source.created,
         'updated': source.updated}
    solrconn.add(**d)
    solrconn.commit()


@receiver(post_delete, sender=Source)
def solr_delete(sender, instance, **kwargs):
    import solr
    from django.conf import settings
    solrconn = solr.SolrConnection(settings.SOLR_SERVER)
    record = solrconn.query("item_id:{0} AND type:elvis_source".format(instance.id))
    if record:
        solrconn.delete(record.results[0]['id'])
        solrconn.commit()
