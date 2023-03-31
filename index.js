const core = require('@actions/core')
const superagent = require('superagent')
const PrivacyApi = require("privacy_api")
const {Connection, PostgresConnection, Job, QueueProject} = require("privacy_api")

async function acquire_token(oauthDomain, client_id, client_secret) {
    return superagent
        .post(`https://${oauthDomain}/oauth/token`)
        .send({
            grant_type: "client_credentials",
            client_id: client_id,
            client_secret: client_secret,
            audience: "https://api.privacydynamics.io"
        })
        .then()
}

async function run() {
    try {
        const project_id = core.getInput('project-id')
        const host = core.getInput('db-host')
        const port = core.getInput('db-port')
        const username = core.getInput('db-username')
        const password = core.getInput('db-password')
        const client_id = core.getInput('client-id')
        const client_secret = core.getInput('client-secret')


        const oauthDomain = (core.getInput('oauth-domain', {required: false}) || "auth.privacydynamics.io")
        const apiUrl = (core.getInput('api-url', {required: false}) || "https://api.privacydynamics.io")

        let defaultClient = PrivacyApi.ApiClient.instance
        defaultClient.basePath = apiUrl
        let oAuth2ClientCredentials = defaultClient.authentications['oAuth2ClientCredentials']

        const token_response = await acquire_token(oauthDomain, client_id, client_secret)
        oAuth2ClientCredentials.accessToken = token_response.body.access_token

        core.info(`Fetching metadata about project ${project_id}`)
        const projectsApi = new PrivacyApi.ProjectsApi()

        const project_response = await new Promise((resolve, reject) => {
            projectsApi.v1ProjectsProjectIdGet(project_id, null, (error, data, response) => {
                if (error) {
                    core.error(error)
                }
                console.info(data)
                resolve(data)
            })
        })
        const dest_connection = project_response.project.destination_connection
        const connnectionsApi = new PrivacyApi.ConnectionsApi()

        core.info(`Update destination connection to: ${username}:${password}@${host}:${port}`)
        const pg_connection = new PostgresConnection(dest_connection.connection_name, dest_connection.database, host, port, username, password)
        pg_connection.input_type = 'postgres'
        const new_connection = new Connection(pg_connection)

        await new Promise((resolve, reject) => {
            connnectionsApi.v1ConnectionsConnectionIdPut(dest_connection.connection_id, {connection: new_connection}, (error, data, response) => {
                resolve(data)
            })
        })

        core.info(`Start new job run on connection ${dest_connection.connection_id}`)
        const jobsApi = new PrivacyApi.JobsApi()
        const newJob = new Job(new QueueProject(QueueProject.JobTypeEnum.queue_project, project_id))
        await new Promise((resolve, reject) => {
            jobsApi.v1JobsQueuePost({job: newJob}, (error, data, response) => {
                resolve(data)
            })
        })

        const dataSetsApi = new PrivacyApi.DatasetsApi()
        const jobRunResponse = await new Promise((resolve, reject) => {
            dataSetsApi.v1JobRunsGet({
                projectId: project_id,
                latest: true,
                limit: 1,
                condensed: true
            }, (error, data, response) => {
                console.log(error)
                console.log(data)
                resolve(data.toJSON())
            })
        })

        const jobRunId = jobRunResponse.job_runs[0].job_run_id

        let in_progress = true

        const unreadyStates = ['SENT', 'STARTED', 'IN PROGRESS', 'RETRY', 'PENDING']
        while (in_progress) {

            let status_response = await new Promise((resolve, reject) => {
                dataSetsApi.v1JobRunsJobRunIdGet(jobRunId, null, (error, data, response) => {
                    resolve(data)
                })
            })
            let status = status_response.job_run.status
            if (unreadyStates.indexOf(status) > -1) {
                core.info("Not done. Wait")
                core.info("Waiting 5 seconds...")
                await new Promise(resolve => setTimeout(resolve, 5000))
            } else {
                in_progress = false
                if (status == "SUCCESS") {
                    core.info('Done')
                } else {
                    throw `Unable to complete job ${jobRunId} with status ${status}`
                }
            }
        }
    } catch (e) {
        core.setFailed(e)
    }
}

run()
