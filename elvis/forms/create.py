from django import forms


class PieceForm(forms.Form):
    # Basic Fields
    title = forms.CharField()
    composer = forms.CharField()
    collections = forms.CharField(required=False)
    composition_start_date = forms.DateField(required=False)
    composition_end_date = forms.DateField(required=False)

    # New composer fields
    composer_birth_date = forms.DateField(required=False)
    composer_death_date = forms.DateField(required=False)

    number_of_voices = forms.IntegerField(required=False)
    languages = forms.CharField(required=False)
    genres = forms.CharField(required=False)
    locations = forms.CharField(required=False)
    sources = forms.CharField(required=False)
    instrumentation = forms.CharField(required=False)





    # Tags - will probably be complicated.
    #tags = forms.CharField(required=False)
    # Comment
    #comment = forms.CharField(required=False)
