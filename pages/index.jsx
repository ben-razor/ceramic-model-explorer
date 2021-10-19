import Head from 'next/head'
import { useEffect, useState } from 'react'
import { Container, Row, Card, Button } from 'react-bootstrap'
import { Image } from 'react-bootstrap'
import ApiGithub from '../lib/ApiGithub'

export default function Home() {

  useEffect(() => {

    let token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
    console.log('token', token);
    let apiGithub = new ApiGithub('ceramicstudio', 'datamodels');

    (async() => {
      let dataModelsRepo = await apiGithub.getRepositoryInfo();
      console.log(dataModelsRepo);

      let tree = await apiGithub.lsTree();
      let packagesFolder = tree.filter(x => x.path === 'packages');
      let packagesURL = packagesFolder[0].url;
      console.log('url', packagesURL);

      let j = await apiGithub.get(packagesURL);

      let dataModels = j.tree;

      for(let model of dataModels) {
        console.log('Model: ', model.ath, model.url);
        let rawContentURL = apiGithub.getRawContentURL('main', `packages/${model.path}/package.json`);
        let r = await fetch(rawContentURL);
        let j = await r.json();
        console.log(j);

        let rawReadmeURL = apiGithub.getRawContentURL('main', `packages/${model.path}/README.md`);
        let rReadme = await fetch(rawReadmeURL);
        let tReadme = await rReadme.text();
        console.log(tReadme);

        let schemasFolderBase = `packages/${model.path}/schemas`
        let schemasFolder = tree.filter(x => x.path.startsWith(schemasFolderBase))

        for(let item of schemasFolder) {
          let schemaFile = item.path.replace(schemasFolderBase, '');
          
          if(schemaFile) {
            let rawSchemaURL = apiGithub.getRawContentURL('main', `${item.path}`);
            console.log('schemaFile', schemaFile);
            console.log(rawSchemaURL);
            let rSchema = await fetch(rawSchemaURL);
            let tSchema = await rSchema.text();
            console.log(tSchema);
          }
        }
      }

      /*
      let pullRequests = await apiGithub.getPullRequests('open'); 

      for(let pr of pullRequests) {
        let head = pr.head;
        let label = head.label;
        let branch = head.ref;
        let repo = head.repo;

        let githubID = label.split(':')[0];
        let fullName = repo.full_name;
        let repoName = fullName.split('/')[1]; 

        let apiGithubPR = new ApiGithub(githubID, repoName);
        let packagesFolder = await apiGithubPR.lsTree('packages', branch);
        let packagesURL = packagesFolder[0].url;
        console.log('url', packagesURL);

        let j = await apiGithubPR.get(packagesURL);

        let dataModels = j.tree;

        for(let model of dataModels) {
          console.log('Model: ', model.path, model.url);

          if(model.path === 'basic-skills') {
            let rawContentURL = apiGithubPR.getRawContentURL(branch, 'package.json');
            console.log('package.json url: ', rawContentURL);
            let r = await fetch(rawContentURL);
            let j = await r.json();
            console.log(j);
          }
        }
      }

      */
    })();
  }, []);

  return (
    <Container className="md-container">
      <Head>
        <title>Ceramic Data Model Explorer</title>
        <link rel="icon" href="/favicon-32x32.png" />
      </Head>
      <Container>
        <h2>
          <Image src="explorer-192.png" width="60" />&nbsp;
          Ceramic Data Model Explorer
        </h2>
        <p>
          Get started by editing <code>pages/index.js</code>
        </p>
        <Container>
          <Row className="justify-content-md-between">
            <Card className="sml-card">
              <Card.Body>
                <Card.Title>Documentation</Card.Title>
                <Card.Text>
                  Find in-depth information about Next.js features and API.
                </Card.Text>
                <Button variant="primary" href="https://nextjs.org/docs">
                  More &rarr;
                </Button>
              </Card.Body>
            </Card>
            <Card className="sml-card">
              <Card.Body>
                <Card.Title>Learn</Card.Title>
                <Card.Text>
                  Learn about Next.js in an interactive course with quizzes!
                </Card.Text>
                <Button variant="primary" href="https://nextjs.org/learn">
                  More &rarr;
                </Button>
              </Card.Body>
            </Card>
          </Row>
          <Row className="justify-content-md-between">
            <Card className="sml-card">
              <Card.Body>
                <Card.Title>Examples</Card.Title>
                <Card.Text>
                  Discover and deploy boilerplate example Next.js projects.
                </Card.Text>
                <Button
                  variant="primary"
                  href="https://github.com/vercel/next.js/tree/master/examples"
                >
                  More &rarr;
                </Button>
              </Card.Body>
            </Card>
            <Card className="sml-card">
              <Card.Body>
                <Card.Title>Deploy</Card.Title>
                <Card.Text>
                  Instantly deploy your Next.js site to a public URL with
                  Vercel.
                </Card.Text>
                <Button
                  variant="primary"
                  href="https://vercel.com/new?utm_source=github&utm_medium=example&utm_campaign=next-example"
                >
                  More &rarr;
                </Button>
              </Card.Body>
            </Card>
          </Row>
        </Container>
      </Container>

      <footer className="cntr-footer">
      </footer>
    </Container>
  )
}
