{{/*
Chart name, truncated for use in resource names.
*/}}
{{- define "agentic-cms.name" -}}
{{- .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Fully qualified app name — <release>-<chart> unless the release name already
contains the chart name.
*/}}
{{- define "agentic-cms.fullname" -}}
{{- if contains .Chart.Name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{/*
Common labels shared by every resource in this chart.
*/}}
{{- define "agentic-cms.labels" -}}
helm.sh/chart: {{ printf "%s-%s" (include "agentic-cms.name" .) .Chart.Version | replace "+" "_" }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}

{{/*
Per-component name, e.g. <release>-agentic-cms-backend.
*/}}
{{- define "agentic-cms.componentName" -}}
{{- printf "%s-%s" (include "agentic-cms.fullname" .context) .component -}}
{{- end -}}

{{/*
Per-component selector labels — used for both the Deployment's selector and
the Service's selector, must stay immutable across releases.
*/}}
{{- define "agentic-cms.selectorLabels" -}}
app.kubernetes.io/name: {{ include "agentic-cms.name" .context }}
app.kubernetes.io/instance: {{ .context.Release.Name }}
app.kubernetes.io/component: {{ .component }}
{{- end -}}
