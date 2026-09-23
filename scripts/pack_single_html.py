#!/usr/bin/env python3
"""Inline public mock images into dist-single/index.html and emit 康尼管理后台.html."""
from __future__ import annotations

import base64
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist-single"
HTML = DIST / "index.html"
PUBLIC = ROOT / "public"

MIME = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".gif": "image/gif",
    ".webp": "image/webp",
}

KN_BOOT = r"""
self.__KN_IMG=self.__KN_IMG||{};
function knAsset(raw){
  if(typeof raw!=="string"||!raw||raw.indexOf("data:")===0)return raw;
  if(raw.charAt(0)==="#"||raw.indexOf("javascript:")===0)return raw;
  var value=raw,m=/^url\((['"]?)(.*)\1\)$/.exec(raw.trim());
  if(m)value=m[2];
  var path=value;
  try{path=new URL(value,"http://kn.local").pathname;}catch(e){}
  var hit=self.__KN_IMG[path]||self.__KN_IMG[value];
  if(!hit)return raw;
  return m?"url("+JSON.stringify(hit)+")":hit;
}
function knPatch(proto,prop){
  var desc=Object.getOwnPropertyDescriptor(proto,prop);
  if(!desc||!desc.set)return;
  Object.defineProperty(proto,prop,{configurable:true,enumerable:desc.enumerable!==false,get:desc.get,set:function(v){desc.set.call(this,knAsset(v));}});
}
knPatch(HTMLImageElement.prototype,"src");
if(typeof HTMLLinkElement!=="undefined")knPatch(HTMLLinkElement.prototype,"href");
var knSetAttr=Element.prototype.setAttribute;
Element.prototype.setAttribute=function(name,value){
  if(name==="src"&&typeof value==="string")value=knAsset(value);
  if(name==="href"&&typeof value==="string"&&value.charAt(0)!=="#")value=knAsset(value);
  return knSetAttr.call(this,name,value);
};
var knSetProp=CSSStyleDeclaration.prototype.setProperty;
CSSStyleDeclaration.prototype.setProperty=function(name,value,priority){
  if(typeof value==="string"&&value.indexOf("url(")!==-1){
    value=value.replace(/url\((['"]?)([^)]+)\1\)/g,function(_,q,u){return "url("+JSON.stringify(knAsset(u))+")";});
  }
  return knSetProp.call(this,name,value,priority);
};
"""


def collect_public_images(public: Path) -> dict[str, str]:
    mapping: dict[str, str] = {}
    for img in sorted(public.rglob("*")):
        if not img.is_file():
            continue
        mime = MIME.get(img.suffix.lower())
        if not mime:
            continue
        rel = "/" + img.relative_to(public).as_posix()
        mapping[rel] = f"data:{mime};base64," + base64.b64encode(img.read_bytes()).decode("ascii")
    return mapping


def inject_kn_assets(html: str, mapping: dict[str, str]) -> str:
    for path in sorted(mapping, key=len, reverse=True):
        expr = f'knAsset("{path}")'
        html = html.replace(f'"{path}"', expr)
        html = html.replace(f"'{path}'", expr)
        html = html.replace(json.dumps(path), expr)
    boot = (
        "<script>self.__KN_IMG="
        + json.dumps(mapping, ensure_ascii=True)
        + ";"
        + KN_BOOT
        + "</script>"
    )
    return html.replace('<div id="root"></div>', boot + '<div id="root"></div>', 1)


def main() -> None:
    html = inject_kn_assets(HTML.read_text(encoding="utf-8"), collect_public_images(PUBLIC))
    HTML.write_text(html, encoding="utf-8")
    dest = DIST / "康尼管理后台.html"
    shutil.copyfile(HTML, dest)
    for extra in ("activities", "decoration"):
        path = DIST / extra
        if path.is_dir():
            shutil.rmtree(path)
    print(dest, "bytes", dest.stat().st_size)


if __name__ == "__main__":
    main()
