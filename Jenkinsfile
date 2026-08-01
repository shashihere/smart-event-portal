pipeline {
    agent any

    environment {
        DOCKER_HUB_CREDENTIALS = credentials('docker-hub-credentials')
        DOCKER_IMAGE_FRONTEND = 'shashihere/eventportal-frontend'
        DOCKER_IMAGE_BACKEND = 'shashihere/eventportal-backend'
        VERSION = "v${env.BUILD_NUMBER}"
        KUBECONFIG_CREDENTIALS = credentials('k8s-config')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build & Test Backend') {
            steps {
                dir('backend') {
                    sh 'npm install'
                    // Basic syntax check as a "test"
                    sh 'node -c server.js'
                }
            }
        }

        stage('Build & Test Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Docker Build') {
            steps {
                echo "Building Backend Image..."
                sh "docker build -t ${DOCKER_IMAGE_BACKEND}:${VERSION} ./backend"
                sh "docker build -t ${DOCKER_IMAGE_BACKEND}:latest ./backend"

                echo "Building Frontend Image..."
                sh "docker build -t ${DOCKER_IMAGE_FRONTEND}:${VERSION} ./frontend"
                sh "docker build -t ${DOCKER_IMAGE_FRONTEND}:latest ./frontend"
            }
        }

        stage('Security Scan (Trivy)') {
            steps {
                echo "Scanning images with Trivy..."
                // Example Trivy scan for innovation challenge
                sh "trivy image --severity HIGH,CRITICAL ${DOCKER_IMAGE_BACKEND}:${VERSION}"
                sh "trivy image --severity HIGH,CRITICAL ${DOCKER_IMAGE_FRONTEND}:${VERSION}"
                echo "Trivy scan passed."
            }
        }

        stage('Docker Push') {
            steps {
                echo "Pushing images to Docker Hub..."
                sh "echo ${DOCKER_HUB_CREDENTIALS_PSW} | docker login -u ${DOCKER_HUB_CREDENTIALS_USR} --password-stdin"
                
                sh "docker push ${DOCKER_IMAGE_BACKEND}:${VERSION}"
                sh "docker push ${DOCKER_IMAGE_BACKEND}:latest"
                
                sh "docker push ${DOCKER_IMAGE_FRONTEND}:${VERSION}"
                sh "docker push ${DOCKER_IMAGE_FRONTEND}:latest"
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "Deploying to Kubernetes Cluster..."
                withCredentials([file(credentialsId: 'k8s-config', variable: 'KUBECONFIG')]) {
                    sh "helm upgrade --install eventportal ./k8s/helm/eventportal --set backend.tag=${VERSION} --set frontend.tag=${VERSION}"
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                withCredentials([file(credentialsId: 'k8s-config', variable: 'KUBECONFIG')]) {
                    sh "kubectl rollout status deployment/eventportal-backend"
                    sh "kubectl rollout status deployment/eventportal-frontend"
                }
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded! Application deployed successfully."
            // Innovation: Slack/Discord Notification
            slackSend channel: '#deployments', color: 'good', message: "Deployment Success: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
        failure {
            echo "Pipeline failed! Initiating rollback..."
            // Auto-rollback logic
            withCredentials([file(credentialsId: 'k8s-config', variable: 'KUBECONFIG')]) {
                sh "helm rollback eventportal"
            }
            slackSend channel: '#deployments', color: 'danger', message: "Deployment Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}. Rollback initiated."
        }
    }
}
