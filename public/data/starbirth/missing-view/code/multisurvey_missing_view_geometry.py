"""Outcome-blind geometry and deterministic review split rules."""
import math


def training_allowed(longitude,group_fold,held_fold):
    distance=abs(((longitude-(held_fold*10+5)+25)%50)-25)-5
    return group_fold!=held_fold and distance>1


def split_sources(source_rows,longitudes):
    ids=sorted(longitudes);parents={name:name for name in ids}
    def root(name):
        while parents[name]!=name:
            parents[name]=parents[parents[name]];name=parents[name]
        return name
    def join(a,b):
        a,b=root(a),root(b);parents[max(a,b)]=min(a,b)
    first_component={};first_anchor={}
    for r in source_rows:
        name=r['designation'];component=r['association_component']
        if component in first_component:join(name,first_component[component])
        else:first_component[component]=name
        if r['wise_ra'] and r['wise_dec']:
            anchor=(float(r['wise_ra']),float(r['wise_dec']))
            if anchor in first_anchor:join(name,first_anchor[anchor])
            else:first_anchor[anchor]=name
    result=[]
    for name in ids:
        group=root(name);tile=math.floor(longitudes[name]/10);fold=math.floor(longitudes[group]/10)%5
        record=dict(designation=name,tile=tile,fold=fold,group=group)
        record.update({f'train_{j}':int(training_allowed(longitudes[name],fold,j)) for j in range(5)})
        result.append(record)
    return result
