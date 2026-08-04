# Hiran Venugopalan

{{ with .Params.kicker }}{{ . }}{{ end }}
{{ with .Params.intent }}{{ . }}{{ end }}

{{ .Content | plainify }}

{{ with .Params.tags }}
## Skills

{{ range . }}- {{ . }}
{{ end }}
{{ end }}
## Experience
{{ range .Params.experience }}
### {{ .role }} · {{ .org }}
{{ .dates }}

{{ .body }}
{{ end }}
{{ with .Params.beyond }}
## Beyond work

{{ . }}
{{ end }}
---
Full site: {{ .Site.BaseURL }}
Contact: hiran.v@gmail.com
