# Minikube deployment

This deploys the fictional banking simulator into its own `banking-simulator`
namespace. It does not modify the existing EC2 deployment or Project 1 resources.

## Images

- Frontend: <https://hub.docker.com/r/subbiah15/banking-simulator-frontend>
- Backend: <https://hub.docker.com/r/subbiah15/banking-simulator-backend>
- PostgreSQL uses the official `postgres:16-alpine` image; a custom database image
  and Docker Hub repository are not required.

Redis stores refresh tokens. The manifests include a single-instance Redis deployment.
Kafka is optional for this project, so its event pipeline is disabled in this Minikube
setup. PostgreSQL uses a persistent volume claim; Redis data is not persisted.

## Prepare the Kubernetes secret

From the Project 2 directory, copy the example and edit the copy locally:

```powershell
Copy-Item deploy\kubernetes\secret.example.yaml deploy\kubernetes\secret.yaml
notepad deploy\kubernetes\secret.yaml
```

Replace every `REPLACE_...` value with a unique value before applying it. `JWT_SECRET`
must contain at least 32 characters. Use fictional demo credentials, not a real
password. Keep `secret.yaml` private; it is excluded from Git.

## Apply the manifests

The Minikube cluster can keep Project 1 running. All resources below are isolated in
the `banking-simulator` namespace.

```powershell
kubectl apply -f deploy\kubernetes\namespace.yaml
kubectl apply -f deploy\kubernetes\secret.yaml
kubectl apply -f deploy\kubernetes\configmap.yaml
kubectl apply -f deploy\kubernetes\service.yaml
kubectl apply -f deploy\kubernetes\deployment.yaml
kubectl get pods,services,pvc -n banking-simulator
kubectl rollout status deployment/postgres -n banking-simulator
kubectl rollout status deployment/redis -n banking-simulator
kubectl rollout status deployment/backend -n banking-simulator
kubectl rollout status deployment/frontend -n banking-simulator
```

The backend runs Flyway migrations at startup. The configured admin account is created
from the secret values; demo users/data seeding remains disabled.

## Open and verify the app

In a PowerShell terminal, run:

```powershell
minikube service frontend -n banking-simulator --url
```

Keep that terminal open and use the printed URL in a browser. The frontend proxies
`/api/` requests to the internal backend Service, so the browser uses the same origin
for UI and API.

To confirm the API is healthy:

```powershell
$url = Read-Host "Enter the Minikube service URL"
Invoke-RestMethod "$url/api/v1/ping"
Invoke-RestMethod "$url/actuator/health"
```

To inspect logs:

```powershell
kubectl logs deployment/backend -n banking-simulator
kubectl logs deployment/postgres -n banking-simulator
```
