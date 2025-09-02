pipeline {
    agent any
    
    parameters {
        string(name: 'ENVIRONMENT', defaultValue: 'dev', description: 'The Environment to deploy (dev, staging, qa)')
        string(name: 'DOCKER_TAG', defaultValue: 'latest', description: 'The tag of the Docker image to deploy')
    }
    
    environment {
        DOCKER_IMAGE = "b2yinfy/collabora-backend-be-${params.ENVIRONMENT}"
        IMAGE_NAME = "collabora-backend-be-${params.ENVIRONMENT}"
        VPS_HOST = "${env.VPS_HOST}"
        VPS_USER = "${env.VPS_USER}"
    }
    
    stages {
        stage('Prepare Variables') {
            steps {
                script {
                    // Assign values dynamically inside script block
                    env.SERVICE_PORT = params.ENVIRONMENT == 'dev' ? '4000' : 
                                       params.ENVIRONMENT == 'staging' ? '4001' : 
                                       params.ENVIRONMENT == 'qa' ? '4002' : '4000'
                    
                    env.NODE_ENV = params.ENVIRONMENT == 'dev' ? 'development' : 
                                   params.ENVIRONMENT == 'staging' ? 'staging' : 'qa'
                }
                
                echo "Environment: ${params.ENVIRONMENT}"
                echo "Node Environment: ${env.NODE_ENV}"
                echo "Docker Image: ${env.IMAGE_NAME}"
                echo "Image Version: ${params.DOCKER_TAG}"
                echo "Service Port: ${env.SERVICE_PORT}"
            }
        }
        
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    sh """
                        docker build --build-arg NODE_ENV=${env.NODE_ENV} --build-arg SERVICE_PORT=${env.SERVICE_PORT} -t ${env.DOCKER_IMAGE}:${params.DOCKER_TAG} .
                    """
                }
            }
        }
        
        stage('Login to DockerHub') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-jenkins-token', usernameVariable: 'DOCKERHUB_CREDENTIALS_USR', passwordVariable: 'DOCKERHUB_CREDENTIALS_PSW')]) {
                        sh """
                            echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin
                        """
                    }
                }
            }
        }
        
        stage('Push Docker Image') {
            steps {
                script {
                    sh "docker push ${env.DOCKER_IMAGE}:${params.DOCKER_TAG}"
                }
            }
        }
        
        stage('Deploy to VPS') {
            steps {
                script {
                    withCredentials([sshUserPrivateKey(credentialsId: 'ssh-jenkins-token', keyFileVariable: 'SSH_KEY')]) {
                        sh """
                            ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${VPS_USER}@${VPS_HOST} '
                                docker pull ${env.DOCKER_IMAGE}:${params.DOCKER_TAG}
                                docker ps -q --filter "name=${env.IMAGE_NAME}" | grep -q . && docker stop ${env.IMAGE_NAME} || echo "Container ${env.IMAGE_NAME} not running"
                                docker ps -aq --filter "name=${env.IMAGE_NAME}" | grep -q . && docker rm ${env.IMAGE_NAME} || echo "Container ${env.IMAGE_NAME} does not exist"
                                docker run -d \\
                                    --name ${env.IMAGE_NAME} \\
                                    --network collabora-docker_collabora-network \\
                                    -p ${env.SERVICE_PORT}:${env.SERVICE_PORT} \\
                                    -e NODE_ENV=${env.NODE_ENV} \\
                                    -e SERVICE_PORT=${env.SERVICE_PORT} \\
                                    ${env.DOCKER_IMAGE}:${params.DOCKER_TAG}
                            '
                        """
                    }
                }
            }
        }
    }
    
    post {
        always {
            sh 'docker logout'
        }
    }
}