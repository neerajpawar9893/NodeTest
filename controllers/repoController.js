const {GITHUB_URL} = require("../utils/constant")
const { gql, GraphQLClient } = require('graphql-request');
const {Octokit}  = require("@octokit/rest");


exports.getRepos = async (req,res,next)=>{
    let {token ,username} = req.body;
    const headers = { Authorization: `bearer ${token}` };
    let data =  new GraphQLClient(GITHUB_URL, { headers });
    const variables = {};
    const query = gql`{
      repositoryOwner(login: "${username}") {
        repositories(first: 50) {
          nodes {
            name
            diskUsage
            owner {          
              login
            }
          }
        }
      }
    }`;
    const repoData = await data.request(query, variables);
    const { nodes } = repoData.repositoryOwner.repositories;
    res.status(200).json({"data":repoData})
   }



exports.getReposDetails = async (req,res,next)=>{
    let {repoName ,username,token} = req.body;
    const headers = { Authorization: `bearer ${token}` };
    let graphData =  new GraphQLClient(GITHUB_URL, { headers });
    const variables = {};
    const query = gql`{
      repository(owner: "${username}", name: "${repoName}") {
        name
        diskUsage
        isPrivate
        owner {
          login
        }   
        object(expression: "HEAD:") {
          ... on Tree {
            entries {
              name
              type
              object {
                ... on Blob {
                  byteSize                  
                }
                ... on Tree {
                  entries {
                    name
                    type
                    object {
                      ... on Blob {
                        byteSize                        
                      }
                    }
                  }
                }
              }
            }
          }
        }        
      }  
    }
  `;
    const data = await graphData.request(query, variables);
    let response = [];

      const { name, diskUsage, isPrivate } = data.repository;
      const { login } = data.repository.owner;    
      let entries = JSON.parse(JSON.stringify(data.repository.object)); 
      const  {folderCount,fileCount} = await getFileNo(entries);   
      const activeWebhook = await activeWebhooks(username, repoName,token );  
      const {text,haveYmlFile} = await ymlFiles(entries,username,repoName);
      response.push({
        "Repository Name": name,
        "Repository Size":diskUsage,
        "Repository Owner":login,
        "Repository is Private":isPrivate,
        "Number of Files on Root Level":fileCount,  
        "Number of Folders on Root Level":folderCount,
        "Have YML File":haveYmlFile,
        "Content of YML File":text,
        "Active Webhooks":activeWebhook     
      });
    res.status(200).json({"data":response})
   }

  async function ymlFiles (files,ownerName,repoName) {    
   
    let text = '';
    for(var i=0;i<files.entries.length;i++){ 
      let splitArr = files.entries[i].name.split('.');
      if(splitArr[1]){        
        if(await fileValidate(files.entries[i].name,'yml')) {      
          //get yml file content
          let variables = {};
          let query = gql`{repository(owner: "${ownerName}", name: "${repoName}") {
            content: object(expression: "HEAD:${splitArr[0]}.yml") {
              ... on Blob {
                text
              }
            }
          }}`;
          let data = await this.graphqlClient.request(query, variables);
          return {text:data.repository.content.text,haveYmlFile:true}; 
       }  
      }        
    }   
    return {text:text,haveYmlFile:false}; 
  }

  async function getFileNo(files) {
    let file = 0;
    let folders = 0;

    const listOf1stLevelFiles = files.entries.filter(it => it.type === 'blob');
    const listofDirectories = files.entries.filter(it => it.type === 'tree');

    file += listOf1stLevelFiles.length;
    folders += listofDirectories.length;   

    return {folderCount:folders, fileCount:file };
  }

  async function activeWebhooks(ownerName, repoName ,token) {
      const octokit = new Octokit({
        auth: token,
      });

      try{
        const response = await octokit.rest.repos.listWebhooks({
          owner: ownerName,
          repo: repoName
        })

        if(response.data.length < 1){
          return "No hook";	
        } else {
          return response.data;
        }

      } catch(err) {
        console.log(err,"<====ERROR")
        return "No hookss";
      }
  }



async function fileValidate(){
    try{
        let validExtension = false;
        if(filename.split('.')[1].toString().trim().toLowerCase() === extension){
            validExtension = true;
        } else{
            validExtension = false;
        }
        return validExtension;
     
    }catch(err){
        return false;
    }
}