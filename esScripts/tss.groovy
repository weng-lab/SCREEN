def result = 1000000000;
def c = {
   if (it['distance'] < result) result = it['distance'];
}
_source['genes']['nearest-all'].each(c);
return result;