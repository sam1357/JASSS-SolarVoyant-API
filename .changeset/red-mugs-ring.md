---
"jasss-user-data": major
"JASSS_API": patch
---

User data has been updated to allow for a user to sign in via an OAuth service. Its tests have also been updated to reflect this. Status codes have been updated to better reflect errors being thrown. Breaking change: Username can no longer be used to authenticate a user, this is handled by email instead. Also modified Terraform config
