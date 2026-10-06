"""Preserve every numbered source question plus supplementary sections.
Source recognition exercises test passage-to-question attribution, not code execution.
"""
import re,json,hashlib
from english_source import translate
from consolidate import consolidate
from public_examples import sanitize_record
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
RES=ROOT/'java mock resource'
categories=[('Spring Core / API Design','Spring & API Design','Injection, APIs, security, and testing'),('Java Fundamentals','Java Fundamentals','Language, collections, concurrency, and patterns'),('Database Core','Database Core','SQL, transactions, indexes, and persistence'),('Distributed Systems','Distributed Systems','Microservices, messaging, and caching'),('CI/CD, Infrastructure & Orchestration','Infrastructure & CI/CD','Delivery pipelines, containers, and cloud'),('Monitoring','Monitoring','Metrics, logs, and JVM diagnostics')]
records=[]
def add(id,title,body,cat,year,line,section,extra=False):
    body=body.strip()
    # Remove common export indentation without damaging nested Markdown/code.
    if year==2025:
        body='\n'.join(s[4:] if s.startswith('    ') else s for s in body.splitlines())
    body=re.sub(r'Java%20Full%20Stack%20Mock/', 'images/',body)
    records.append(dict(id=id,title=title.strip(),body=body,category=cat,year=year,line=line,section=section,supplement=extra,priority='★' in title))
text=(RES/'2026mock.md').read_text(); lines=text.splitlines()
starts=[(i,re.match(r'^### (\d+)\.(\d+) (.+)',s)) for i,s in enumerate(lines) if re.match(r'^### (\d+)\.(\d+) (.+)',s)]
for j,(i,m) in enumerate(starts):
    end=starts[j+1][0] if j+1<len(starts) else len(lines)
    body='\n'.join(lines[i+1:end]); body=re.split(r'\n# [1-6]\. ',body)[0].strip().rstrip('-').strip()
    add('y26-'+m[1]+'.'+m[2],m[3],body,int(m[1]),2026,i+1,m[1]+'.'+m[2])
intro=text.split('## 0.')[1].split('# 1.')[0]
add('y26-projects','Fictional team learning context',intro,1,2026,13,'Project context',True)
lines=translate((RES/'2025mock.md').read_text()).splitlines(); section='Java Core'; cat=2; starts=[]; fence=False
for i,s in enumerate(lines):
    if s.lstrip().startswith('```'): fence=not fence; continue
    if fence: continue
    if s.startswith('#'):
        section=s.lstrip('# ').strip()
        if s.startswith('# '):
            cat={'Java Core':2,'Java 8':2,'Design Patterns':2,'JDBC, Hibernate, Database':3,'Spring':1,'Microservices':4,'SQL':3,'STREAM':2}.get(section,cat)
        if section=='CI/CD': cat=5
        if section in ['Async + RabbitMQ','Topics to revisit']: cat=4
    m=re.match(r'^\d+\. (.+)',s)
    if m:
        title=m[1]; c=cat
        if re.search('memory leak|monitor your|debug your|ELK',title,re.I):c=6
        if re.search('gateway|circuit breaker',title,re.I):c=4
        if re.search('Swagger|secure your endpoint|user authorization|configuration file|environments',title,re.I):c=1
        if re.search('Vertical Scaling|Cloud Service',title,re.I):c=5
        starts.append((i,title,c,section))
for j,(i,title,cat,section) in enumerate(starts):
    end=starts[j+1][0] if j+1<len(starts) else next(k for k in range(i+1,len(lines)) if lines[k]=='# SQL')
    # Trailing section headings belong to next question; fenced headings stay intact.
    chunk=lines[i+1:end]
    while chunk and (not chunk[-1].strip() or chunk[-1].startswith('#')): chunk.pop()
    add('y25-'+str(j+1).zfill(3),title,'\n'.join(chunk),cat,2025,i+1,section)
for title,cat in [('SQL',3),('STREAM',2)]:
    i=lines.index('# '+title); end=lines.index('# STREAM') if title=='SQL' else len(lines)
    add('y25-extra-'+title.lower(),title+' supplementary notes','\n'.join(lines[i+1:end]),cat,2025,i+1,title,True)
# Source caveats retained visibly, rather than silently rewriting the notes.
for r in records:
    r['caution']='Legacy 2025 notes may contain older APIs or imprecise claims. Cross-check overlapping topics with the 2026 notes. Chinese passages have been translated into English.' if r['year']==2025 else ''
    if r['id']=='y25-extra-sql':r['caution']='This legacy SQL example is not executable as written: an early semicolon and the aggregate/window expression need correction. Retained for reference, not as a model solution.'
    if r['id']=='y25-extra-stream':r['caution']='The legacy example maps to String before sorting with Person::getAge. Sort the Person stream before mapping to names. Terminal-operation descriptions have been clarified in the English edition.'
    if 'thread life cycle' in r['title'].lower():r['caution']='Java Thread.State contains NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, and TERMINATED. Running is not a separate enum state.'
    if 'thread life cycle' in r['title'].lower():
        english_states = '''**English reference: Java thread states**

| State | Meaning |
| --- | --- |
| NEW | Created but not yet started. |
| RUNNABLE | Executing in the JVM, or eligible to execute. |
| BLOCKED | Waiting to acquire a monitor lock. |
| WAITING | Waiting indefinitely for another thread's action. |
| TIMED_WAITING | Waiting for at most a specified time. |
| TERMINATED | Execution has completed. |

*This English reference replaces the Chinese-language illustration in the original notes. The original file is unchanged.*'''
        r['body'] = r['body'].replace('![image.png](images/image%201.png)', english_states)
    if 'final, finally' in r['title']:r['caution']='finalize is not guaranteed to run and must not be relied on for cleanup. A finally block is also not guaranteed to execute if the process terminates.'
# Deterministic recognition items, with provenance; do not pretend these are authored scenario questions.
def excerpt(body):
    body=re.split(r'\*\*Project connection|\*\*Interview wording',body)[0]
    body=re.sub(r'!\[.*?\]\(.*?\)','',body)
    body=re.sub(r'^\*\*(Core answer|General configuration)\*\*\s*','',body)
    return body.strip()[:1100].rsplit('\n',1)[0] or body.strip()[:1100]
def make_recognition(records, same_year=True):
    recognition=[]
    for r in records:
        if r['supplement'] or len(r['body'])<30: continue
        candidates=[x for x in records if x['category']==r['category'] and (not same_year or x['year']==r['year']) and x['id']!=r['id'] and not x['supplement']]
        def terms(s):return set(re.findall(r'[a-z]{4,}',s.lower()))-{'what','does','with','have','your','when','which','that','from','difference','between','explain','java','spring','provide','example'}
        # Avoid near-duplicate questions as distractors.
        candidates=sorted(candidates,key=lambda x:(len(terms(x['title'])&terms(r['title'])),hashlib.sha256((r['id']+x['id']).encode()).hexdigest()))
        opts=[r]+candidates[:3]
        recognition.append(dict(id='rec-'+r['id'],type='single',category=r['category'],sourceIds=[r['id']],track='source',prompt='Which original question does this passage primarily answer?' if same_year else 'Which topic does this passage primarily explain?',passage=excerpt(r['body']),options=[x['title'] for x in opts],answer=[0],explanation=('Original question: ' if same_year else 'Study topic: ')+r['title']+'. This exercise tests passage-to-topic recognition. Read the full answer in the source below.'))
    return recognition
original=[sanitize_record(r) for r in records]
legacy=make_recognition(original)
records,aliases=consolidate(original)
recognition=make_recognition(records, same_year=False)
current_ids={q['id'] for q in recognition}
legacy=[dict(q,sourceIds=[aliases[id] for id in q['sourceIds']]) for q in legacy if q['id'] not in current_ids]
out={'revision':3,'categories':[dict(id=i+1,name=x[0],label=x[1],description=x[2]) for i,x in enumerate(categories)],'sources':records,'recognition':recognition,'legacyRecognition':legacy,'aliases':aliases,'originalCounts':{'2026':140,'2025':164,'supplements':3}}
(ROOT/'public/data/library.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
# Images are reviewed publication assets already committed under public/images.
# Never copy arbitrary private resource attachments into the public build.
report={'originalQuestions':304,'originalEntries':len(original),'consolidatedTopics':len(records),'practiceTopics':len(recognition),'mergedEntries':len(original)-len(records),'mergedTopics':sum(len(r['references'])>1 for r in records),'2025OnlyTopics':sum(r['years']==[2025] for r in records),'2026PrimaryTopics':sum(r['year']==2026 for r in records),'categories':{str(i):sum(r['category']==i for r in records) for i in range(1,7)}}
(ROOT/'public/data/coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
(ROOT/'public/data/merge-map.json').write_text(json.dumps([{'primaryId':r['id'],'title':r['title'],'sourceIds':[x['id'] for x in r['references']]} for r in records],ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
