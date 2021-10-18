import Head from 'next/head'
import { useEffect } from 'react'
import { Container, Row, Card, Button } from 'react-bootstrap'
import { Image } from 'react-bootstrap'

export default function Home() {

  useEffect(() => {
    (async() => {
      let r = await fetch('https://api.github.com/orgs/ceramicstudio/repos');

      let j = await r.json();

      let dataModelsRepo = j.filter(x => x.name === 'datamodels')[0];

      r = await fetch('https://api.github.com/repos/ceramicstudio/datamodels/git/trees/main');
      j = await r.json();
      
      let packagesFolder = j.tree.filter(x => x.path === 'packages')[0];
      let packagesURL = packagesFolder.url;

      r = await fetch(packagesURL);
      j = await r.json();

      let dataModels = j.tree;

      for(let model of dataModels) {
        console.log('Model: ', model.path, model.url);
      }
      
      console.log(dataModelsRepo);
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
