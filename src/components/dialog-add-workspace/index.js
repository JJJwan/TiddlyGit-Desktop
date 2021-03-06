// @flow
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { GraphQLClient, ClientContext } from 'graphql-hooks';

import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';

import { GITHUB_GRAPHQL_API } from '../../constants/auth';

import Description from './description-and-mode-switch';
import SearchRepo from './search-repo';
import NewWikiDoneButton from './new-wiki-done-button';
import NewWikiPathForm from './new-wiki-path-form';
import ExistedWikiPathForm from './existed-wiki-path-form';
import ExistedWikiDoneButton from './existed-wiki-done-button';
import CloneWikiDoneButton from './clone-wiki-done-button';
import { getGithubUserInfo, setGithubUserInfo } from '../../helpers/user-info';
import type { IUserInfo } from '../../helpers/user-info';
import TabBar from './tab-bar';
import GitTokenForm, { getGithubToken, setGithubToken } from '../shared/git-token-form';

import {
  requestOpen,
  getDesktopPath,
  countWorkspace,
  getWorkspaceRemote,
  getSubWikiPluginContent,
} from '../../senders';

const graphqlClient = new GraphQLClient({
  url: GITHUB_GRAPHQL_API,
});

const Container = styled.main`
  display: flex;
  flex-direction: column;
  overflow: scroll;
  &::-webkit-scrollbar {
    width: 0;
  }
`;
const SyncContainer = styled(Paper)`
  margin-top: 5px;
`;
const GithubRepoLink = styled(Typography)`
  cursor: pointer;
  opacity: 50%;
  &:hover {
    opacity: 100%;
  }
`;

const setHeaderToGraphqlClient = (token: string) => graphqlClient.setHeader('Authorization', `bearer ${token}`);
const previousToken = getGithubToken();
previousToken && setHeaderToGraphqlClient(previousToken);

export default function AddWorkspace() {
  const [currentTab, currentTabSetter] = useState('CloneOnlineWiki');
  const [isCreateMainWorkspace, isCreateMainWorkspaceSetter] = useState(countWorkspace() === 0);
  const [parentFolderLocation, parentFolderLocationSetter] = useState(getDesktopPath());
  const [existedFolderLocation, existedFolderLocationSetter] = useState(getDesktopPath());
  const [wikiPort, wikiPortSetter] = useState(5212 + countWorkspace());

  // try get token on start up, so Github GraphQL client can use it
  const [accessToken, accessTokenSetter] = useState<string | void>(previousToken);
  // try get token from local storage, and set to state for gql to use
  useEffect(() => {
    if (accessToken) {
      graphqlClient.setHeader('Authorization', `bearer ${accessToken}`);
      setGithubToken(accessToken);
    } else {
      Object.keys(graphqlClient.headers).map(key => graphqlClient.removeHeader(key));
      setGithubToken();
    }
  }, [accessToken]);

  const [userInfo, userInfoSetter] = useState<IUserInfo | void>(getGithubUserInfo());
  useEffect(() => {
    setGithubUserInfo(userInfo);
  }, [userInfo]);

  const [mainWikiToLink, mainWikiToLinkSetter] = useState({ name: '', port: 0 });
  const [tagName, tagNameSetter] = useState<string>('');
  const [fileSystemPaths, fileSystemPathsSetter] = useState([]);
  useEffect(() => {
    // eslint-disable-next-line promise/catch-or-return
    getSubWikiPluginContent(mainWikiToLink.name).then(fileSystemPathsSetter);
  }, [mainWikiToLink]);
  const [githubWikiUrl, githubWikiUrlSetter] = useState<string>('');
  useEffect(() => {
    async function getWorkspaceRemoteInEffect() {
      const url = await getWorkspaceRemote(existedFolderLocation);
      url && githubWikiUrlSetter(url);
    }
    getWorkspaceRemoteInEffect();
  }, [githubWikiUrl, existedFolderLocation]);

  const [wikiFolderName, wikiFolderNameSetter] = useState('tiddlywiki');

  return (
    <ClientContext.Provider value={graphqlClient}>
      <TabBar currentTab={currentTab} currentTabSetter={currentTabSetter} />
      <Description
        isCreateMainWorkspace={isCreateMainWorkspace}
        isCreateMainWorkspaceSetter={isCreateMainWorkspaceSetter}
      />
    <SyncContainer elevation={2} square>

      <GitTokenForm
        accessTokenSetter={accessTokenSetter}
        userInfoSetter={userInfoSetter}
        accessToken={accessToken}
      >
        {githubWikiUrl && (
          <GithubRepoLink onClick={() => requestOpen(githubWikiUrl)} variant="subtitle2" align="center">
            ({githubWikiUrl})
          </GithubRepoLink>
        )}
        <SearchRepo
          githubWikiUrl={githubWikiUrl}
          accessToken={accessToken}
          githubWikiUrlSetter={githubWikiUrlSetter}
          userInfo={userInfo}
          currentTab={currentTab}
          wikiFolderNameSetter={wikiFolderNameSetter}
          isCreateMainWorkspace={isCreateMainWorkspace}
        />
      </GitTokenForm>
    </SyncContainer>

      {currentTab === 'CreateNewWiki' && (
        <Container>
          <NewWikiPathForm
            parentFolderLocation={parentFolderLocation}
            parentFolderLocationSetter={parentFolderLocationSetter}
            wikiFolderName={wikiFolderName}
            tagName={tagName}
            tagNameSetter={tagNameSetter}
            wikiFolderNameSetter={wikiFolderNameSetter}
            mainWikiToLink={mainWikiToLink}
            mainWikiToLinkSetter={mainWikiToLinkSetter}
            wikiPort={wikiPort}
            wikiPortSetter={wikiPortSetter}
            fileSystemPaths={fileSystemPaths}
            isCreateMainWorkspace={isCreateMainWorkspace}
          />

          <NewWikiDoneButton
            isCreateMainWorkspace={isCreateMainWorkspace}
            wikiPort={wikiPort}
            mainWikiToLink={mainWikiToLink}
            githubWikiUrl={githubWikiUrl}
            wikiFolderName={wikiFolderName}
            tagName={tagName}
            parentFolderLocation={parentFolderLocation}
            userInfo={userInfo}
          />
        </Container>
      )}
      {currentTab === 'OpenLocalWiki' && (
        <Container>
          <ExistedWikiPathForm
            existedFolderLocationSetter={existedFolderLocationSetter}
            existedFolderLocation={existedFolderLocation}
            wikiFolderName={wikiFolderName}
            tagName={tagName}
            tagNameSetter={tagNameSetter}
            wikiFolderNameSetter={wikiFolderNameSetter}
            mainWikiToLink={mainWikiToLink}
            mainWikiToLinkSetter={mainWikiToLinkSetter}
            wikiPort={wikiPort}
            wikiPortSetter={wikiPortSetter}
            fileSystemPaths={fileSystemPaths}
            isCreateMainWorkspace={isCreateMainWorkspace}
          />

          <ExistedWikiDoneButton
            isCreateMainWorkspace={isCreateMainWorkspace}
            wikiPort={wikiPort}
            mainWikiToLink={mainWikiToLink}
            githubWikiUrl={githubWikiUrl}
            tagName={tagName}
            existedFolderLocation={existedFolderLocation}
            userInfo={userInfo}
          />
        </Container>
      )}
      {currentTab === 'CloneOnlineWiki' && (
        <Container>
          <NewWikiPathForm
            parentFolderLocation={parentFolderLocation}
            parentFolderLocationSetter={parentFolderLocationSetter}
            wikiFolderName={wikiFolderName}
            tagName={tagName}
            tagNameSetter={tagNameSetter}
            wikiFolderNameSetter={wikiFolderNameSetter}
            mainWikiToLink={mainWikiToLink}
            mainWikiToLinkSetter={mainWikiToLinkSetter}
            wikiPort={wikiPort}
            wikiPortSetter={wikiPortSetter}
            fileSystemPaths={fileSystemPaths}
            isCreateMainWorkspace={isCreateMainWorkspace}
          />
          <CloneWikiDoneButton
            isCreateMainWorkspace={isCreateMainWorkspace}
            wikiPort={wikiPort}
            mainWikiToLink={mainWikiToLink}
            githubWikiUrl={githubWikiUrl}
            wikiFolderName={wikiFolderName}
            tagName={tagName}
            parentFolderLocation={parentFolderLocation}
            userInfo={userInfo}
          />
        </Container>
      )}
    </ClientContext.Provider>
  );
}
