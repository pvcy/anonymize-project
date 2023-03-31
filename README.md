# Anonymize Data with Privacy Dynamics

This GitHub Action allows you to anonymize sensitive data using Privacy Dynamics, an online service that uses state-of-the-art
algorithms to ensure privacy and anonymity of production data. This action will help you protect sensitive production data
in dev, test, and preview environments without disclosing customer data.

# Prerequisites

This action requires the following:

* An active Privacy Dynamics account. Don't have one? You can get one [here](https://signup.privacydynamics.io/).
* Source data stored in a Postgresql, accessible to the Privacy Dynamics service.
* A configured Project within your Privacy Dynamics account using your Postgresql data source as a Origin Connection.
* Machine-to-machine credentials for your account. [Contact us](mailto:support@privacydynamics.io) so we can generate those for you.

# Usage

To use this action in your GitHub repository, you need to create a workflow file (e.g. `.github/workflows/anonymize.yml`) with the
following contents:

```yaml
name: Anonymize Data
on:
  pull_request:
    branches: [ main ]

jobs:
  anonymize:
  runs-on: ubuntu-latest
  steps:
  - name: Anonymize Data
    uses: pvcy/anonymize-project@v1
  with:
    project-id: 4e1213f4-my-project-uuid-0242ac120002
    db-host: my_postgres_host.host.com
    db-port: 5432
    db-username: postgres_username
    db-password: postgres_password
    client-id: ClientIDFromYourPDAccount
    client-secret: ClientSecretFromYourPDAccount
```

# Configuration Parameters
The following configuration parameters can be used to customize the behavior of the action:

* `project-id` (required): The ID of Privacy Dynamics Project configured to anonymize data for this instance of the GitHub Action.
* `db-host` (required, default: `localhost`): Hostname of Postgresql engine to send anonymized data to. Must be made accessible to GitHub Actions runner.
* `db-port` (required, default: `5432`): Port of Postgresql engine to send anonymized data to.
* `db-username` (required): Username of Postgresql engine to send anonymized data to.
* `db-password` (required): Password of Postgresql engine to send anonymized data to.
* `client-id` (required): M2M Client ID provided from your Privacy Dynamics account.
* `client-secret` (required): Client secret provided from your Privacy Dynamics account.
* `api-url` (optional): API Url for Privacy Dynamics. Defaults to SaaS instance. This is only required if you are running the On-Prem version of Privacy Dynamics.


# Contributing

If you want to contribute to this project, feel free to submit pull requests or open issues on GitHub.

# License

This project is licensed under the MIT License. See the LICENSE file for details.
