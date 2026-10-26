# -*- coding: utf-8 -*-
import os
import zipfile

src = r'C:\Users\33135\.dsh\dsh_wechat\name-reactions\dist-single'
out = r'C:\Users\33135\.dsh\dsh_wechat\name-reactions\pages-single-v2.zip'
if os.path.exists(out):
    os.remove(out)

with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(src):
        for f in files:
            full = os.path.join(root, f)
            rel = os.path.relpath(full, src).replace('\\', '/')
            z.write(full, rel)

z = zipfile.ZipFile(out)
n = z.namelist()
html = z.read('index.html').decode('utf-8')
print('entries', len(n), 'KB', round(os.path.getsize(out) / 1024, 1))
print('starts:', html[:30].replace('\n', ' '))
print('external assets ref:', 'src="./assets/' in html)
print('script tags:', html.count('</script>'))
print('root:', [x for x in n if '/' not in x])
