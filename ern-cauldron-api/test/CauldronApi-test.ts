import { assert, expect } from 'chai';
import sinon from 'sinon';
import {
  AppNameDescriptor,
  AppPlatformDescriptor,
  AppVersionDescriptor,
  PackagePath,
  utils,
} from 'ern-core';
import { fixtures } from 'ern-util-dev';
import { doesNotReject, rejects } from 'assert';
import {
  CauldronCodePushEntry,
  ICauldronDocumentStore,
  ICauldronFileStore,
} from '../src/types';
import CauldronApi from '../src/CauldronApi';
import EphemeralFileStore from '../src/EphemeralFileStore';
import InMemoryDocumentStore from '../src/InMemoryDocumentStore';
import jp from 'jsonpath';
import fs from 'fs';
import path from 'path';

const sandbox = sinon.createSandbox();

const codePushNewEntryFixture: CauldronCodePushEntry = {
  jsApiImpls: ['react-native-test-js-api-impl@1.0.0'],
  metadata: {
    appVersion: '17.7',
    deploymentName: 'QA',
    isMandatory: true,
    label: 'v18',
    releaseMethod: 'Upload',
    releasedBy: 'test@gmail.com',
    rollout: 100,
    size: 522938,
  },
  miniapps: ['@test/react-native-foo@4.0.4', 'react-native-bar@2.0.2'],
};

let documentStore: ICauldronDocumentStore;
let fileStore: ICauldronFileStore;

const fixtureFileStorePath = path.join(__dirname, 'fixtures/filestore');

function cauldronApi({
  cauldronDocument,
  storePath,
}: {
  cauldronDocument?: any;
  storePath?: string;
} = {}) {
  cauldronDocument = cauldronDocument || getCauldronFixtureClone();
  documentStore = new InMemoryDocumentStore(cauldronDocument);
  fileStore = new EphemeralFileStore({ storePath });

  return new CauldronApi(documentStore, fileStore);
}

function getCauldronFixtureClone() {
  return JSON.parse(JSON.stringify(fixtures.defaultCauldron));
}

describe('CauldronApi.js', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('upgradeCauldronSchema', () => {
    it('should properly upgrade a cauldron [schema 0.0.0 => 3.0.0]', async () => {
      sandbox.stub(utils, 'isGitBranch').resolves(true);
      const fixture = JSON.parse(
        fs
          .readFileSync(path.join(__dirname, 'fixtures/cauldron-0.0.0.json'))
          .toString(),
      );
      const api = cauldronApi({ cauldronDocument: fixture });
      await api.upgradeCauldronSchema();
      const expectedCauldronDoc = JSON.parse(
        fs
          .readFileSync(path.join(__dirname, 'fixtures/cauldron-3.0.0.json'))
          .toString(),
      );
      const cauldronDoc = await api.getCauldron();
      expect(cauldronDoc).eql(expectedCauldronDoc);
    });
  });

  describe('commit', () => {
    it('should call commit on the document store', async () => {
      const api = cauldronApi();
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.commit('commit-message');
      sinon.assert.calledOnce(commitStub);
    });

    it('should call commit with the proper commit message', async () => {
      const api = cauldronApi();
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.commit('commit-message');
      sinon.assert.calledWith(commitStub, 'commit-message');
    });
  });

  describe('getCauldron', () => {
    it('should return the Cauldron document', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const cauldron = await cauldronApi().getCauldron();
      expect(cauldron).eql(tmpFixture);
    });
  });

  describe('getCauldronSchemaVersion', () => {
    it('should return the Cauldron schema version', async () => {
      const schemaVersion = await cauldronApi().getCauldronSchemaVersion();
      expect(schemaVersion).eql('3.0.0');
    });

    it('should return 0.0.0 if schemaVersion property is missing', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      delete tmpFixture.schemaVersion;
      const schemaVersion = await cauldronApi({
        cauldronDocument: tmpFixture,
      }).getCauldronSchemaVersion();
      expect(schemaVersion).eql('0.0.0');
    });
  });

  describe('beginTransaction', () => {
    it('should call beginTransaction on the document store', async () => {
      const api = cauldronApi();
      const beginTransactionStub = sandbox.stub(
        documentStore,
        'beginTransaction',
      );
      await api.beginTransaction();
      sinon.assert.calledOnce(beginTransactionStub);
    });

    it('should call beginTransaction on the file store', async () => {
      const api = cauldronApi();
      const beginTransactionStub = sandbox.stub(fileStore, 'beginTransaction');
      await api.beginTransaction();
      sinon.assert.calledOnce(beginTransactionStub);
    });
  });

  describe('discardTransaction', () => {
    it('should call discardTransaction on the document store', async () => {
      const api = cauldronApi();
      const discardTransactionStub = sandbox.stub(
        documentStore,
        'discardTransaction',
      );
      await api.discardTransaction();
      sinon.assert.calledOnce(discardTransactionStub);
    });

    it('should call discardTransaction on the file store', async () => {
      const api = cauldronApi();
      const discardTransactionStub = sandbox.stub(
        fileStore,
        'discardTransaction',
      );
      await api.discardTransaction();
      sinon.assert.calledOnce(discardTransactionStub);
    });
  });

  describe('commitTransaction', () => {
    it('should call commitTransaction on the document store', async () => {
      const api = cauldronApi();
      const commitTransactionStub = sandbox.stub(
        documentStore,
        'commitTransaction',
      );
      await api.commitTransaction('commit-message');
      sinon.assert.calledOnce(commitTransactionStub);
    });

    it('should call commitTransaction on the document store with the right commit message', async () => {
      const api = cauldronApi();
      const commitTransactionStub = sandbox.stub(
        documentStore,
        'commitTransaction',
      );
      await api.commitTransaction('commit-message');
      sinon.assert.calledWith(commitTransactionStub, 'commit-message');
    });

    it('should call commitTransaction on the file store ', async () => {
      const api = cauldronApi();
      const commitTransactionStub = sandbox.stub(
        fileStore,
        'commitTransaction',
      );
      await api.commitTransaction('commit-message');
      sinon.assert.calledOnce(commitTransactionStub);
    });

    it('should call commitTransaction on the file store with the right commit message', async () => {
      const api = cauldronApi();
      const commitTransactionStub = sandbox.stub(
        fileStore,
        'commitTransaction',
      );
      await api.commitTransaction('commit-message');
      sinon.assert.calledWith(commitTransactionStub, 'commit-message');
    });
  });

  describe('getNativeApplications', () => {
    it('should return the native applications', async () => {
      const nativeApps = await cauldronApi().getNativeApplications();
      expect(nativeApps).eql(fixtures.defaultCauldron.nativeApps);
    });
  });

  describe('getNativeApplication', () => {
    it('should return the native applications array', async () => {
      const nativeApp = await cauldronApi().getNativeApplication(
        'test'.toAppDescriptor(),
      );
      const nativeAppsObj = jp.query(
        fixtures.defaultCauldron,
        '$.nativeApps[?(@.name=="test")]',
      )[0];
      expect(nativeApp).eql(nativeAppsObj);
    });

    it('should throw if the application name is not found', async () => {
      const api = cauldronApi();
      assert(rejects(api.getNativeApplication('missing'.toAppDescriptor())));
    });
  });

  describe('getPlatforms', () => {
    it('should return the platforms array', async () => {
      const platforms = await cauldronApi().getPlatforms(
        'test'.toAppDescriptor(),
      );
      expect(platforms).to.be.an('array').of.length(1);
    });

    it('should throw if the application name is not found', async () => {
      const api = cauldronApi();
      assert(rejects(api.getPlatforms('missing'.toAppDescriptor())));
    });
  });

  describe('getPlatform', () => {
    it('should return the platform object given its name', async () => {
      const platformObj = await cauldronApi().getPlatform(
        AppPlatformDescriptor.fromString('test:android'),
      );
      const platform = jp.query(
        fixtures.defaultCauldron,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")]',
      )[0];
      expect(platform).eql(platformObj);
    });

    it('should throw if the platform is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(api.getPlatform(AppPlatformDescriptor.fromString('test:ios'))),
      );
    });

    it('should throw if the native application is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getPlatform(AppPlatformDescriptor.fromString('missing:android')),
        ),
      );
    });
  });

  describe('getVersions', () => {
    it('should return the versions array', async () => {
      const versionsArr = await cauldronApi().getVersions(
        AppPlatformDescriptor.fromString('test:android'),
      );
      const versions = jp.query(
        fixtures.defaultCauldron,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions',
      )[0];
      expect(versionsArr).eql(versions);
    });

    it('should throw if the native application platform does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(api.getVersions(AppPlatformDescriptor.fromString('test:ios'))),
      );
    });

    it('should throw if the native application name does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getVersions(AppPlatformDescriptor.fromString('missing:android')),
        ),
      );
    });
  });

  describe('getVersion', () => {
    it('should return the version object', async () => {
      const versionObj = await cauldronApi().getVersion(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
      );
      const version = jp.query(
        fixtures.defaultCauldron,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]',
      )[0];
      expect(versionObj).eql(version);
    });

    it('should throw if the native application version does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getVersion(AppVersionDescriptor.fromString('test:android:0.1.0')),
        ),
      );
    });

    it('should throw if the native application platform does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getVersion(AppVersionDescriptor.fromString('test:ios:0.1.0')),
        ),
      );
    });

    it('should throw if the native application name does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getVersion(
            AppVersionDescriptor.fromString('missing:android:17.7.0'),
          ),
        ),
      );
    });
  });

  describe('getCodePushEntries', () => {
    it('should return the code push Production entries', async () => {
      const entries = await cauldronApi().getCodePushEntries(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Production',
      );
      expect(entries).to.be.an('array').of.length(2);
    });

    it('should return the code push QA entries', async () => {
      const entries = await cauldronApi().getCodePushEntries(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'QA',
      );
      expect(entries).to.be.an('array').of.length(1);
    });

    it('should throw if native application version is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getCodePushEntries(
            AppVersionDescriptor.fromString('test:android:1.0.0'),
            'QA',
          ),
        ),
      );
    });

    it('should throw if native application platform does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getCodePushEntries(
            AppVersionDescriptor.fromString('test:ios:1.0.0'),
            'QA',
          ),
        ),
      );
    });

    it('should throw if native application name does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getCodePushEntries(
            AppVersionDescriptor.fromString('missing:android:17.7.0'),
            'QA',
          ),
        ),
      );
    });
  });

  describe('setCodePushEntries', () => {
    it('should set the code push entries', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).setCodePushEntries(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'QA',
        [codePushNewEntryFixture],
      );
      const codePushEntries = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].codePush["QA"]',
      )[0];
      expect(codePushEntries).eql([codePushNewEntryFixture]);
    });

    it('should throw if the native application version does not exists', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.setCodePushEntries(
            AppVersionDescriptor.fromString('test:android:1.0.0'),
            'QA',
            [codePushNewEntryFixture],
          ),
        ),
      );
    });
  });

  describe('getContainerMiniApps', () => {
    it('should return the MiniApps array of a native application version Container', async () => {
      const containerMiniApps = await cauldronApi().getContainerMiniApps(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
      );
      expect(containerMiniApps).to.be.an('array').of.length(2);
    });

    it('should throw if native application version does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getContainerMiniApps(
            AppVersionDescriptor.fromString('test:android:1.0.0'),
          ),
        ),
      );
    });

    it('should throw if native application platform does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getContainerMiniApps(
            AppVersionDescriptor.fromString('test:ios:17.7.0'),
          ),
        ),
      );
    });

    it('should throw if native application name does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getContainerMiniApps(
            AppVersionDescriptor.fromString('missing:android:17.7.0'),
          ),
        ),
      );
    });
  });

  describe('getNativeDependencies', () => {
    it('should return the native dependencies of a native application version Container', async () => {
      const containerDependencies = await cauldronApi().getNativeDependencies(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
      );
      expect(containerDependencies).to.be.an('array').of.length(4);
    });

    it('should throw if native application version does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getNativeDependencies(
            AppVersionDescriptor.fromString('test:android:1.0.0'),
          ),
        ),
      );
    });

    it('should throw if native application platform does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getNativeDependencies(
            AppVersionDescriptor.fromString('test:ios:17.7.0'),
          ),
        ),
      );
    });

    it('should throw if native application name does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getNativeDependencies(
            AppVersionDescriptor.fromString('missing:android:17.7.0'),
          ),
        ),
      );
    });
  });

  describe('getContainerJsApiImpls', () => {
    it('should throw an error if the native application version does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getContainerJsApiImpls(
            AppVersionDescriptor.fromString('test:android:1.0.0'),
          ),
        ),
      );
    });

    it('should return the JavaScript API implementations package paths', async () => {
      const result = await cauldronApi().getContainerJsApiImpls(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
      );
      expect(result).to.be.an('array').of.length(1);
      expect(result[0]).eql('react-native-my-api-impl@1.0.0');
    });
  });

  describe('getContainerJsApiImpl', () => {
    it('should throw an error if the native application version does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getContainerJsApiImpl(
            AppVersionDescriptor.fromString('test:android:17.10.0'),
            'react-native-my-api-impl',
          ),
        ),
      );
    });

    it('should return the JavaScript API implementation package path [1]', async () => {
      const result = await cauldronApi().getContainerJsApiImpl(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'react-native-my-api-impl',
      );
      expect(result).eql('react-native-my-api-impl@1.0.0');
    });

    it('should return the JavaScript API implementation package path [2]', async () => {
      const result = await cauldronApi().getContainerJsApiImpl(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'react-native-my-api-impl@1.0.0',
      );
      expect(result).eql('react-native-my-api-impl@1.0.0');
    });
  });

  describe('getNativeDependency', () => {
    it('should return the native dependency string if no version is provided', async () => {
      const dependency = await cauldronApi().getContainerNativeDependency(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'react-native-electrode-bridge',
      );
      expect(dependency).eql('react-native-electrode-bridge@1.4.9');
    });

    it('should return the native dependency string if version is provided', async () => {
      const dependency = await cauldronApi().getContainerNativeDependency(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'react-native-electrode-bridge@1.4.9',
      );
      expect(dependency).eql('react-native-electrode-bridge@1.4.9');
    });

    it('should throw if incorrect version is provided', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getContainerNativeDependency(
            AppVersionDescriptor.fromString('test:android:17.7.0'),
            'react-native-electrode-bridge@0.1.0',
          ),
        ),
      );
    });

    it('should throw if dependency does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getContainerNativeDependency(
            AppVersionDescriptor.fromString('test:android:17.7.0'),
            'missing',
          ),
        ),
      );
    });

    it('should throw if native application version does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getContainerNativeDependency(
            AppVersionDescriptor.fromString('test:android:0.1.0'),
            'react-native-electrode-bridge',
          ),
        ),
      );
    });

    it('should throw if native application platform does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getContainerNativeDependency(
            AppVersionDescriptor.fromString('test:ios:17.7.0'),
            'react-native-electrode-bridge',
          ),
        ),
      );
    });

    it('should throw if native application name does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getContainerNativeDependency(
            AppVersionDescriptor.fromString('missing:android:17.7.0'),
            'react-native-electrode-bridge',
          ),
        ),
      );
    });
  });

  describe('getConfig', () => {
    it('[get application version config] should return the native application version config', async () => {
      const configObj = await cauldronApi({
        storePath: fixtureFileStorePath,
      }).getConfig(AppVersionDescriptor.fromString('test:android:17.7.0'));
      const config = fs.readFileSync(
        path.join(fixtureFileStorePath, 'config/test-android-17.7.0.json'),
      );
      expect(configObj).eql(JSON.parse(config.toString()));
    });

    it('[get application version config] should throw if the native application version does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getConfig(AppVersionDescriptor.fromString('test:android:1.0.0')),
        ),
      );
    });

    it('[get application platform config] should return the native application platform config', async () => {
      const configObj = await cauldronApi({
        storePath: fixtureFileStorePath,
      }).getConfig(AppPlatformDescriptor.fromString('test:android'));
      const config = fs.readFileSync(
        path.join(fixtureFileStorePath, 'config/test-android.json'),
      );
      expect(configObj).eql(JSON.parse(config.toString()));
    });

    it('[get application platform config] should throw if the native application platform does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(api.getConfig(AppPlatformDescriptor.fromString('test:ios'))),
      );
    });

    it('[get application config] should return the native application name config', async () => {
      const configObj = await cauldronApi({
        storePath: fixtureFileStorePath,
      }).getConfig(AppNameDescriptor.fromString('test'));
      const config = fs.readFileSync(
        path.join(fixtureFileStorePath, 'config/test.json'),
      );
      expect(configObj).eql(JSON.parse(config.toString()));
    });

    it('[get application config] should throw if native application does not exist', async () => {
      const api = cauldronApi();
      assert(rejects(api.getConfig(AppNameDescriptor.fromString('missing'))));
    });
  });

  describe('clearCauldron', () => {
    it('should empty the Cauldron', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({ cauldronDocument: tmpFixture }).clearCauldron();
      expect(tmpFixture.nativeApps).empty;
    });
  });

  describe('addDescriptor', () => {
    it('should add a native application entry', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({ cauldronDocument: tmpFixture }).addDescriptor(
        AppNameDescriptor.fromString('newapp'),
      );
      const app = jp.query(tmpFixture, '$.nativeApps[?(@.name=="newapp")]')[0];
      expect(app).not.undefined;
    });

    it('should add a native application and platform entry', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({ cauldronDocument: tmpFixture }).addDescriptor(
        AppPlatformDescriptor.fromString('newapp:android'),
      );
      const platform = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="newapp")].platforms[?(@.name=="android")]',
      )[0];
      expect(platform).not.undefined;
    });

    it('should add a native application and platform and version entry', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({ cauldronDocument: tmpFixture }).addDescriptor(
        AppVersionDescriptor.fromString('newapp:android:1.0.0'),
      );
      const platform = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="newapp")].platforms[?(@.name=="android")].versions[?(@.name=="1.0.0")]',
      )[0];
      expect(platform).not.undefined;
    });
  });

  describe('removeDescriptor', () => {
    it('should remove a top level native app', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({ cauldronDocument: tmpFixture }).removeDescriptor(
        AppNameDescriptor.fromString('test'),
      );
      const result = jp.query(tmpFixture, '$.nativeApps[?(@.name=="test")]')[0];
      expect(result).undefined;
    });

    it('should remove a native application platform', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({ cauldronDocument: tmpFixture }).removeDescriptor(
        AppPlatformDescriptor.fromString('test:android'),
      );
      const result = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")]',
      )[0];
      expect(result).undefined;
    });

    it('should remove a native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({ cauldronDocument: tmpFixture }).removeDescriptor(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
      );
      const result = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]',
      )[0];
      expect(result).undefined;
    });
  });

  describe('createNativeApplication', () => {
    it('should create the native application object', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).createNativeApplication({ name: 'newapp' });
      const app = jp.query(tmpFixture, '$.nativeApps[?(@.name=="newapp")]')[0];
      expect(app).not.undefined;
    });

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.createNativeApplication({ name: 'newapp' });
      sinon.assert.calledOnce(commitStub);
    });

    it('should throw if the native application name already exists', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      assert(rejects(api.createNativeApplication({ name: 'test' })));
    });
  });

  describe('removeNativeApplication', () => {
    it('should remove the native application given its name', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).removeNativeApplication(AppNameDescriptor.fromString('test'));
      const nativeApp = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")]',
      )[0];
      expect(nativeApp).undefined;
    });

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.removeNativeApplication(AppNameDescriptor.fromString('test'));
      sinon.assert.calledOnce(commitStub);
    });

    it('should throw if the application name does not exists', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.removeNativeApplication(AppNameDescriptor.fromString('missing')),
        ),
      );
    });
  });

  describe('createPlatform', () => {
    it('should create the platform object', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).createPlatform(AppNameDescriptor.fromString('test'), { name: 'ios' });
      const platform = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="ios")]',
      )[0];
      expect(platform).not.undefined;
    });

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.createPlatform(AppNameDescriptor.fromString('test'), {
        name: 'ios',
      });
      sinon.assert.calledOnce(commitStub);
    });

    it('should throw if the application platform already exists', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.createPlatform(AppNameDescriptor.fromString('test'), {
            name: 'android',
          }),
        ),
      );
    });
  });

  describe('removePlatform', () => {
    it('should remove the native application platform given its name', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({ cauldronDocument: tmpFixture }).removePlatform(
        AppPlatformDescriptor.fromString('test:android'),
      );
      const platform = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")]',
      )[0];
      expect(platform).undefined;
    });

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.removePlatform(
        AppPlatformDescriptor.fromString('test:android'),
      );
      sinon.assert.calledOnce(commitStub);
    });

    it('should throw if the application name does not exists', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.removePlatform(
            AppPlatformDescriptor.fromString('missing:android'),
          ),
        ),
      );
    });

    it('should throw if the application platform does not exists', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.removePlatform(AppPlatformDescriptor.fromString('test:ios')),
        ),
      );
    });
  });

  describe('createVersion', () => {
    it('should create the version object', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).createVersion(AppPlatformDescriptor.fromString('test:android'), {
        name: '17.20.0',
      });
      const version = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.20.0")]',
      )[0];
      expect(version).not.undefined;
    });

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.createVersion(
        AppPlatformDescriptor.fromString('test:android'),
        { name: '17.20.0' },
      );
      sinon.assert.calledOnce(commitStub);
    });

    it('should throw if the platform does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.createVersion(AppPlatformDescriptor.fromString('test:ios'), {
            name: '17.20.0',
          }),
        ),
      );
    });

    it('should throw if the version already exists', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.createVersion(AppPlatformDescriptor.fromString('test:android'), {
            name: '17.7.0',
          }),
        ),
      );
    });
  });

  describe('removeVersion', () => {
    it('should remove the native application version given its name', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({ cauldronDocument: tmpFixture }).removeVersion(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
      );
      const version = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]',
      )[0];
      expect(version).undefined;
    });

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.removeVersion(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
      );
      sinon.assert.calledOnce(commitStub);
    });

    it('should throw if the platform name does not exists', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.removeVersion(AppVersionDescriptor.fromString('test:ios:17.7.0')),
        ),
      );
    });

    it('should throw if the version does not exists', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.removeVersion(
            AppVersionDescriptor.fromString('test:android:1.0.0'),
          ),
        ),
      );
    });
  });

  describe('updateVersion', () => {
    it('should perform the update', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).updateVersion(AppVersionDescriptor.fromString('test:android:17.7.0'), {
        isReleased: false,
      });
      const version = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]',
      )[0];
      expect(version.isReleased).false;
    });

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.updateVersion(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        { isReleased: false },
      );
      sinon.assert.calledOnce(commitStub);
    });

    it('should throw if the version does not exists', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.updateVersion(
            AppVersionDescriptor.fromString('test:android:0.1.0'),
            { isReleased: false },
          ),
        ),
      );
    });
  });

  describe('addOrUpdateDescription', () => {
    it('should add a description if it does not exist yet', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const newDescription = 'new description';
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addOrUpdateDescription(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        newDescription,
      );
      const version = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]',
      )[0];
      expect(version.description).eql(newDescription);
    });

    it('should update a description if it already exist', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const updatedDescription = 'updated description';
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addOrUpdateDescription(
        AppVersionDescriptor.fromString('test:android:17.8.0'),
        updatedDescription,
      );
      const version = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.8.0")]',
      )[0];
      expect(version.description).eql(updatedDescription);
    });

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.addOrUpdateDescription(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'new description',
      );
      sinon.assert.calledOnce(commitStub);
    });

    it('should throw if the version does not exists', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.addOrUpdateDescription(
            AppVersionDescriptor.fromString('test:android:0.1.0'),
            'new description',
          ),
        ),
      );
    });
  });

  describe('removePackageFromContainer [Native Dependency]', () => {
    it('should remove the native dependency', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).removePackageFromContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-electrode-bridge'),
        'nativeDeps',
      );
      const dependenciesArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.nativeDeps',
      )[0];
      expect(dependenciesArr.includes('react-native-electrode-bridge@1.4.9'))
        .false;
    });

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.removePackageFromContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-electrode-bridge'),
        'nativeDeps',
      );
      sinon.assert.calledOnce(commitStub);
    });

    it('should throw if the dependency is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.removePackageFromContainer(
            AppVersionDescriptor.fromString('test:android:17.7.0'),
            PackagePath.fromString('missing'),
            'nativeDeps',
          ),
        ),
      );
    });

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.removePackageFromContainer(
            AppVersionDescriptor.fromString('test:android:17.20.0'),
            PackagePath.fromString('react-native-electrode-bridge'),
            'nativeDeps',
          ),
        ),
      );
    });
  });

  describe('updatePackageInContainer [MiniApp]', () => {
    it('should update the MiniApp version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).updatePackageInContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-bar@3.0.0'),
        'miniApps',
      );
      const miniAppsArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.miniApps',
      )[0];
      expect(miniAppsArr.includes('react-native-bar@3.0.0')).true;
      expect(miniAppsArr.includes('react-native-bar@2.0.0')).false;
    });

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.updatePackageInContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-bar@3.0.0'),
        'miniApps',
      );
      sinon.assert.calledOnce(commitStub);
    });

    it('should throw if the miniapp is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.updatePackageInContainer(
            AppVersionDescriptor.fromString('test:android:17.7.0'),
            PackagePath.fromString('react-native-foo@3.0.0'),
            'miniApps',
          ),
        ),
      );
    });

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.updatePackageInContainer(
            AppVersionDescriptor.fromString('test:android:17.20.0'),
            PackagePath.fromString('react-native-bar@3.0.0'),
            'miniApps',
          ),
        ),
      );
    });
  });

  describe('updateTopLevelContainerVersion', () => {
    it('should update the top level container version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).updateTopLevelContainerVersion(
        AppPlatformDescriptor.fromString('test:android'),
        '2.0.0',
      );
      const topLevelContainerVersion = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].containerVersion',
      )[0];
      expect(topLevelContainerVersion).eql('2.0.0');
    });

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.updateTopLevelContainerVersion(
        AppPlatformDescriptor.fromString('test:android'),
        '2.0.0',
      );
      sinon.assert.calledOnce(commitStub);
    });
  });

  describe('updateContainerVersion', () => {
    it('should update the container version of the given native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).updateContainerVersion(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        '2.0.0',
      );
      const nativeAppContainerVersion = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].containerVersion',
      )[0];
      expect(nativeAppContainerVersion).eql('2.0.0');
    });

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.updateContainerVersion(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        '2.0.0',
      );
      sinon.assert.calledOnce(commitStub);
    });

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.updateContainerVersion(
            AppVersionDescriptor.fromString('test:android:17.20.0'),
            '2.0.0',
          ),
        ),
      );
    });
  });

  describe('getTopLevelContainerVersion', () => {
    it('should return the top level container version', async () => {
      const result = await cauldronApi().getTopLevelContainerVersion(
        AppPlatformDescriptor.fromString('test:android'),
      );
      expect(result).eql('1.16.44');
    });
  });

  describe('getContainerVersion', () => {
    it('should return the container version of the given native application version', async () => {
      const result = await cauldronApi().getContainerVersion(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
      );
      expect(result).eql('1.16.44');
    });

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getContainerVersion(
            AppVersionDescriptor.fromString('test:android:17.20.0'),
          ),
        ),
      );
    });
  });

  describe('removePackageFromContainer [MiniApp]', () => {
    it('should remove the MiniApp from the container of the native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).removePackageFromContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-bar'),
        'miniApps',
      );
      const miniAppsArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.miniApps',
      )[0];
      expect(miniAppsArr.includes('react-native-bare@2.0.0')).false;
    });

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.removePackageFromContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-bar'),
        'miniApps',
      );
      sinon.assert.calledOnce(commitStub);
    });

    it('should throw if the MiniApp is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.removePackageFromContainer(
            AppVersionDescriptor.fromString('test:android:17.7.0'),
            PackagePath.fromString('missing'),
            'miniApps',
          ),
        ),
      );
    });

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.removePackageFromContainer(
            AppVersionDescriptor.fromString('test:android:17.20.0'),
            PackagePath.fromString('react-native-bar'),
            'miniApps',
          ),
        ),
      );
    });
  });

  describe('addPackageToContainer [MiniApp]', () => {
    it('should add the MiniApp to the container of the native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({ cauldronDocument: tmpFixture }).addPackageToContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('newMiniApp@1.0.0'),
        'miniApps',
      );
      const miniAppsArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.miniApps',
      )[0];
      expect(miniAppsArr.includes('newMiniApp@1.0.0')).true;
    });

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.addPackageToContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('newMiniApp@1.0.0'),
        'miniApps',
      );
      sinon.assert.calledOnce(commitStub);
    });

    it('should throw if the MiniApp already exists', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.addPackageToContainer(
            AppVersionDescriptor.fromString('test:android:17.7.0'),
            PackagePath.fromString('react-native-bar@2.0.0'),
            'miniApps',
          ),
        ),
      );
    });

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.addPackageToContainer(
            AppVersionDescriptor.fromString('test:android:17.20.0'),
            PackagePath.fromString('newMiniApp@1.0.0'),
            'miniApps',
          ),
        ),
      );
    });
  });

  describe('addPackageToContainer [Native Dependency]', () => {
    it('should add the native dependency to the container of the native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addPackageToContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('testDep@1.0.0'),
        'nativeDeps',
      );
      const dependenciesArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.nativeDeps',
      )[0];
      expect(dependenciesArr.includes('testDep@1.0.0')).true;
    });

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.addPackageToContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('testDep@1.0.0'),
        'nativeDeps',
      );
      sinon.assert.calledOnce(commitStub);
    });

    it('should throw if the dependency already exists', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.addPackageToContainer(
            AppVersionDescriptor.fromString('test:android:17.7.0'),
            PackagePath.fromString('react-native-electrode-bridge@1.4.9'),
            'nativeDeps',
          ),
        ),
      );
    });

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.addPackageToContainer(
            AppVersionDescriptor.fromString('test:android:17.20.0'),
            PackagePath.fromString('testDep@1.0.0'),
            'nativeDeps',
          ),
        ),
      );
    });
  });

  describe('addPackageToContainer [JS API Implementation]', () => {
    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.addPackageToContainer(
            AppVersionDescriptor.fromString('test:android:17.20.0'),
            PackagePath.fromString('react-native-new-js-api-impl@1.0.0'),
            'jsApiImpls',
          ),
        ),
      );
    });

    it('should throw if the js api impl already exists', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.addPackageToContainer(
            AppVersionDescriptor.fromString('test:android:17.7.0'),
            PackagePath.fromString('react-native-my-api-impl@1.0.0'),
            'jsApiImpls',
          ),
        ),
      );
    });

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.addPackageToContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-new-js-api-impl@1.0.0'),
        'jsApiImpls',
      );
      sinon.assert.calledOnce(commitStub);
    });

    it('should add the JS API impl to the container of the native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addPackageToContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-new-js-api-impl@1.0.0'),
        'jsApiImpls',
      );
      const dependenciesArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.jsApiImpls',
      )[0];
      expect(dependenciesArr.includes('react-native-new-js-api-impl@1.0.0'))
        .true;
    });
  });

  describe('removePackageFromContainer [JS API Implementation]', () => {
    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.removePackageFromContainer(
            AppVersionDescriptor.fromString('test:android:17.20.0'),
            PackagePath.fromString('react-native-my-api-impl@1.0.0'),
            'jsApiImpls',
          ),
        ),
      );
    });

    it('should throw if the js api impl is not found [1]', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.removePackageFromContainer(
            AppVersionDescriptor.fromString('test:android:17.7.0'),
            PackagePath.fromString('react-native-unknown-api-impl'),
            'jsApiImpls',
          ),
        ),
      );
    });

    it('should throw if the js api impl is not found [2]', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.removePackageFromContainer(
            AppVersionDescriptor.fromString('test:android:17.7.0'),
            PackagePath.fromString('react-native-unknown-api-impl@1.0.0'),
            'jsApiImpls',
          ),
        ),
      );
    });

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.removePackageFromContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-my-api-impl@1.0.0'),
        'jsApiImpls',
      );
      sinon.assert.calledOnce(commitStub);
    });

    it('should remove the JS API impl from the container of the native application version [1]', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).removePackageFromContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-my-api-impl'),
        'jsApiImpls',
      );
      const dependenciesArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.jsApiImpls',
      )[0];
      expect(dependenciesArr).not.includes('react-native-my-api-impl@1.0.0');
    });

    it('should remove the JS API impl from the container of the native application version [2]', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).removePackageFromContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-my-api-impl@1.0.0'),
        'jsApiImpls',
      );
      const dependenciesArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.jsApiImpls',
      )[0];
      expect(dependenciesArr).not.includes('react-native-my-api-impl@1.0.0');
    });
  });

  describe('updatePackageInContainer [JS API Implementation]', () => {
    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.updatePackageInContainer(
            AppVersionDescriptor.fromString('test:android:17.20.0'),
            PackagePath.fromString('react-native-my-api-impl@2.0.0'),
            'jsApiImpls',
          ),
        ),
      );
    });

    it('should throw if the js api impl is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.updatePackageInContainer(
            AppVersionDescriptor.fromString('test:android:17.7.0'),
            PackagePath.fromString('react-native-unknown-api-impl@1.0.0'),
            'jsApiImpls',
          ),
        ),
      );
    });

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.updatePackageInContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-my-api-impl@2.0.0'),
        'jsApiImpls',
      );
      sinon.assert.calledOnce(commitStub);
    });

    it('should update the JS API impl version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).updatePackageInContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('react-native-my-api-impl@2.0.0'),
        'jsApiImpls',
      );
      const dependenciesArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.jsApiImpls',
      )[0];
      expect(dependenciesArr).includes('react-native-my-api-impl@2.0.0');
    });
  });

  describe('addCodePushEntry', () => {
    it('should add the code push entry to QA', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({ cauldronDocument: tmpFixture }).addCodePushEntry(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        codePushNewEntryFixture,
      );
      const entries = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].codePush["QA"]',
      )[0];
      expect(entries).to.be.an('array').of.length(2);
    });

    it('should add the code push entry to new deployment name', async () => {
      const modifiedCodePushEntryFixture = Object.assign(
        {},
        codePushNewEntryFixture,
      );
      modifiedCodePushEntryFixture.metadata.deploymentName = 'STAGING';
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({ cauldronDocument: tmpFixture }).addCodePushEntry(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        modifiedCodePushEntryFixture,
      );
      const entries = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].codePush["STAGING"]',
      )[0];
      expect(entries).to.be.an('array').of.length(1);
    });

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.addCodePushEntry(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        codePushNewEntryFixture,
      );
      sinon.assert.calledOnce(commitStub);
    });

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.addCodePushEntry(
            AppVersionDescriptor.fromString('test:android:17.20.0'),
            codePushNewEntryFixture,
          ),
        ),
      );
    });
  });

  describe('addFile', () => {
    it('should throw if cauldronFilePath is undefined', async () => {
      const api = cauldronApi();
      assert(rejects(api.addFile({ fileContent: 'content' })));
    });

    it('should throw if fileContent is undefined', async () => {
      const api = cauldronApi();
      assert(rejects(api.addFile({ cauldronFilePath: 'dir/file' })));
    });

    it('should throw if file already exist', async () => {
      const api = cauldronApi();
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      });
      assert(
        rejects(
          api.addFile({
            cauldronFilePath: 'dir/file',
            fileContent: 'newcontent',
          }),
        ),
      );
    });

    it('should not throw in nominal proper use case', async () => {
      const api = cauldronApi();
      assert(
        doesNotReject(
          api.addFile({
            cauldronFilePath: 'dir/file',
            fileContent: 'content',
          }),
        ),
      );
    });

    it('should add the file [non cauldron scheme]', async () => {
      const api = cauldronApi();
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      });
      assert(await api.hasFile({ cauldronFilePath: 'dir/file' }));
    });

    it('should add the file [cauldron scheme]', async () => {
      const api = cauldronApi();
      await api.addFile({
        cauldronFilePath: 'cauldron://dir/file',
        fileContent: 'content',
      });
      assert(await api.hasFile({ cauldronFilePath: 'dir/file' }));
    });
  });

  describe('updateFile', () => {
    it('should throw if cauldronFilePath is undefined', async () => {
      const api = cauldronApi();
      assert(rejects(api.updateFile({ fileContent: 'content' })));
    });

    it('should throw if fileContent is undefined', async () => {
      const api = cauldronApi();
      assert(rejects(api.updateFile({ cauldronFilePath: 'dir/file' })));
    });

    it('should throw if file does not already exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.updateFile({
            cauldronFilePath: 'dir/file',
            fileContent: 'newcontent',
          }),
        ),
      );
    });

    it('should not throw in nominal proper use case', async () => {
      const api = cauldronApi();
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      });
      assert(
        doesNotReject(
          api.updateFile({
            cauldronFilePath: 'dir/file',
            fileContent: 'content',
          }),
        ),
      );
    });

    it('should update the file [non cauldron scheme]', async () => {
      const api = cauldronApi();
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      });
      assert(
        doesNotReject(
          api.updateFile({
            cauldronFilePath: 'dir/file',
            fileContent: 'content',
          }),
        ),
      );
    });

    it('should update the file [cauldron scheme]', async () => {
      const api = cauldronApi();
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      });
      assert(
        doesNotReject(
          api.updateFile({
            cauldronFilePath: 'cauldron://dir/file',
            fileContent: 'content',
          }),
        ),
      );
    });
  });

  describe('removeFile', () => {
    it('should throw if cauldronFilePath is undefined', async () => {
      const api = cauldronApi();
      assert(rejects(api.removeFile({})));
    });

    it('should throw if file does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.removeFile({
            cauldronFilePath: 'dir/file',
          }),
        ),
      );
    });

    it('should not throw in nominal proper use case', async () => {
      const api = cauldronApi();
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      });
      assert(
        doesNotReject(
          api.removeFile({
            cauldronFilePath: 'dir/file',
          }),
        ),
      );
    });

    it('should remove the file [non cauldron scheme]', async () => {
      const api = cauldronApi();
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      });
      await api.removeFile({
        cauldronFilePath: 'dir/file',
      });
      assert(!(await api.hasFile({ cauldronFilePath: 'dir/file' })));
    });

    it('should remove the file [cauldron scheme]', async () => {
      const api = cauldronApi();
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      });
      await api.removeFile({
        cauldronFilePath: 'cauldron://dir/file',
      });
      assert(!(await api.hasFile({ cauldronFilePath: 'dir/file' })));
    });
  });

  describe('getFile', () => {
    it('should throw if cauldronFilePath is undefined', async () => {
      const api = cauldronApi();
      assert(rejects(api.getFile({})));
    });

    it('should throw if file does not exist', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getFile({
            cauldronFilePath: 'dir/file',
          }),
        ),
      );
    });

    it('should not throw in nominal proper use case', async () => {
      const api = cauldronApi();
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      });
      assert(
        doesNotReject(
          api.getFile({
            cauldronFilePath: 'dir/file',
          }),
        ),
      );
    });

    it('should get the file [non cauldron scheme]', async () => {
      const api = cauldronApi();
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      });
      const file = await api.getFile({ cauldronFilePath: 'dir/file' });
      expect(file.toString()).eql('content');
    });

    it('should get the file [cauldron scheme]', async () => {
      const api = cauldronApi();
      await api.addFile({
        cauldronFilePath: 'dir/file',
        fileContent: 'content',
      });
      const file = await api.getFile({
        cauldronFilePath: 'cauldron://dir/file',
      });
      expect(file.toString()).eql('content');
    });
  });

  describe('hasYarnLock', () => {
    it('should return true if the native application version has the given yarn lock key', async () => {
      const hasYarnLock = await cauldronApi().hasYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Production',
      );
      expect(hasYarnLock).to.be.true;
    });

    it('should return false if the native application version does not have the given yarn lock key', async () => {
      const hasYarnLock = await cauldronApi().hasYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Unexisting',
      );
      expect(hasYarnLock).to.be.false;
    });

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.hasYarnLock(
            AppVersionDescriptor.fromString('test:android:17.20.0'),
            'Production',
          ),
        ),
      );
    });
  });

  describe('addYarnLock', () => {
    it('should properly add the yarn lock', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({ cauldronDocument: tmpFixture }).addYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'YARN_LOCK_KEY',
        'YARN_LOCK_CONTENT',
      );
      const entry = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].yarnLocks["YARN_LOCK_KEY"]',
      )[0];
      expect(entry).not.undefined;
    });

    it('should commit the document store', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.addYarnLock(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'YARN_LOCK_KEY',
        'YARN_LOCK_CONTENT',
      );
      sinon.assert.calledOnce(commitStub);
    });

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.addYarnLock(
            AppVersionDescriptor.fromString('test:android:17.20.0'),
            'YARN_LOCK_KEY',
            'YARN_LOCK_CONTENT',
          ),
        ),
      );
    });
  });

  describe('getYarnLockId', () => {
    it('should properly return the yarn lock id if it exists', async () => {
      const id = await cauldronApi().getYarnLockId(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Production',
      );
      expect(id).eql('a0112c49-4bbc-47a9-ba45-d43e1e84a1a5');
    });

    it('should return undefined if the yarn lock key does not exists', async () => {
      const id = await cauldronApi().getYarnLockId(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'UnknownKey',
      );
      expect(id).undefined;
    });

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getYarnLockId(
            AppVersionDescriptor.fromString('test:android:17.20.0'),
            'Production',
          ),
        ),
      );
    });
  });

  describe('getYarnLock', () => {
    it('should throw if the native application version is not found', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e';
      const api = cauldronApi();
      assert(
        rejects(
          api.getYarnLock(
            AppVersionDescriptor.fromString('test:android:17.20.0'),
            'Production',
          ),
        ),
      );
    });
  });

  describe('getPathToYarnLock', () => {
    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.getPathToYarnLock(
            AppVersionDescriptor.fromString('test:android:17.20.0'),
            'Production',
          ),
        ),
      );
    });
  });

  describe('removeYarnLock', () => {
    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.removeYarnLock(
            AppVersionDescriptor.fromString('test:android:17.20.0'),
            'Production',
          ),
        ),
      );
    });
  });

  describe('updateYarnLock', () => {
    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.updateYarnLock(
            AppVersionDescriptor.fromString('test:android:17.20.0'),
            'Production',
            'NewLock',
          ),
        ),
      );
    });
  });

  describe('updateYarnLockId', () => {
    it('should properly update the yarn lock id of an existing key', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e';
      const api = cauldronApi();
      await api.updateYarnLockId(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Production',
        newId,
      );
      const id = await api.getYarnLockId(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'Production',
      );
      expect(id).eql(newId);
    });

    it('should properly set the yarn lock id of an unexisting key', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e';
      const api = cauldronApi();
      await api.updateYarnLockId(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'NewKey',
        newId,
      );
      const id = await api.getYarnLockId(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'NewKey',
      );
      expect(id).eql(newId);
    });

    it('should throw if the native application version is not found', async () => {
      const newId = '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e';
      const api = cauldronApi();
      assert(
        rejects(
          api.updateYarnLockId(
            AppVersionDescriptor.fromString('test:android:17.20.0'),
            'NewKey',
            newId,
          ),
        ),
      );
    });
  });

  describe('setYarnLocks', () => {
    it('should set the yarn locks', async () => {
      const yarnLocks = { test: '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e' };
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({ cauldronDocument: tmpFixture }).setYarnLocks(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        yarnLocks,
      );
      const yarnLocksObj = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].yarnLocks',
      )[0];
      expect(yarnLocksObj).eql(yarnLocks);
    });

    it('should commit the document store', async () => {
      const yarnLocks = { test: '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e' };
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const commitStub = sandbox.stub(documentStore, 'commit');
      await api.setYarnLocks(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        yarnLocks,
      );
      sinon.assert.calledOnce(commitStub);
    });

    it('should throw if the native application version is not found', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.setYarnLocks(
            AppVersionDescriptor.fromString('test:android:17.20.0'),
            { Test: '30bf4eff61586d71fe5d52e31a2cfabcbb31e33e' },
          ),
        ),
      );
    });
  });

  describe('addBundle', () => {
    it('should properly add the bundle', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({ cauldronDocument: tmpFixture }).addBundle(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'BUNDLE_CONTENT',
      );
    });
  });

  describe('hasBundle', () => {
    it('should return true if there is a stored bundle for the given native application descriptor', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      await api.addBundle(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'BUNDLE_CONTENT',
      );
      assert(
        await api.hasBundle(
          AppVersionDescriptor.fromString('test:android:17.7.0'),
        ),
      );
    });

    it('should return false if there is no stored bundle for the given native application descriptor', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      assert(
        !(await api.hasBundle(
          AppVersionDescriptor.fromString('test:android:17.7.0'),
        )),
      );
    });
  });

  describe('getBundle', () => {
    it('should throw if there is no stored bundle for the given native application descriptor', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      assert(
        rejects(
          api.getBundle(AppVersionDescriptor.fromString('test:android:17.7.0')),
        ),
      );
    });

    it('should return the stored bundle for the given native application descriptor', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      await api.addBundle(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        'BUNDLE_CONTENT',
      );
      const result = await api.getBundle(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
      );
      expect(result.toString()).eql('BUNDLE_CONTENT');
    });
  });

  describe('addPackageToContainer [MiniApp Branch]', () => {
    it('should throw if the MiniApp path does not include a branch', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.addPackageToContainer(
            AppVersionDescriptor.fromString('test:android:17.7.0'),
            PackagePath.fromString('https://github.com/org/repo.git'),
            'miniAppsBranches',
          ),
        ),
      );
    });

    it('should add the MiniApp to the target container miniAppsBranches array', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addPackageToContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/org/repo.git#master'),
        'miniAppsBranches',
      );
      const miniAppsArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.miniAppsBranches',
      )[0];
      expect(miniAppsArr.includes('https://github.com/org/repo.git#master'))
        .true;
    });

    it('should throw if the MiniApp already has a branch specified', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      await api.addPackageToContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/org/repo.git#master'),
        'miniAppsBranches',
      );
      assert(
        rejects(
          api.addPackageToContainer(
            AppVersionDescriptor.fromString('test:android:17.7.0'),
            PackagePath.fromString('https://github.com/org/repo.git#dev'),
            'miniAppsBranches',
          ),
        ),
      );
    });
  });

  describe('addPackageToContainer [JS API Implementation branch]', () => {
    it('should throw if the JS API Impl path does not include a branch', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.addPackageToContainer(
            AppVersionDescriptor.fromString('test:android:17.7.0'),
            PackagePath.fromString('https://github.com/org/repo.git'),
            'jsApiImplsBranches',
          ),
        ),
      );
    });

    it('should add the JS API Impl to the target container jsApiImplsBranches array', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addPackageToContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/org/repo.git#master'),
        'jsApiImplsBranches',
      );
      const jsApiImplsBranchesArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.jsApiImplsBranches',
      )[0];
      expect(
        jsApiImplsBranchesArr.includes(
          'https://github.com/org/repo.git#master',
        ),
      ).true;
    });

    it('should throw if the JS API impl already has a branch specified', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      await api.addPackageToContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/org/repo.git#master'),
        'jsApiImplsBranches',
      );
      assert(
        rejects(
          api.addPackageToContainer(
            AppVersionDescriptor.fromString('test:android:17.7.0'),
            PackagePath.fromString('https://github.com/org/repo.git#dev'),
            'jsApiImplsBranches',
          ),
        ),
      );
    });
  });

  describe('updatePackageInContainer [MiniApp branch]', () => {
    it('should throw if the MiniApp path does not include a branch', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.updatePackageInContainer(
            AppVersionDescriptor.fromString('test:android:17.7.0'),
            PackagePath.fromString('https://github.com/org/repo.git'),
            'miniAppsBranches',
          ),
        ),
      );
    });

    it('should update the MiniApp branch in the target container miniAppsBranches array', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addPackageToContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/org/repo.git#master'),
        'miniAppsBranches',
      );
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).updatePackageInContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/org/repo.git#dev'),
        'miniAppsBranches',
      );
      const miniAppsArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.miniAppsBranches',
      )[0];
      expect(miniAppsArr.includes('https://github.com/org/repo.git#dev')).true;
    });
  });

  describe('updateJsApiImplBranchInContainer', () => {
    it('should throw if the JS API Impl path does not include a branch', async () => {
      const api = cauldronApi();
      assert(
        rejects(
          api.updatePackageInContainer(
            AppVersionDescriptor.fromString('test:android:17.7.0'),
            PackagePath.fromString('https://github.com/org/repo.git'),
            'jsApiImplsBranches',
          ),
        ),
      );
    });

    it('should update the JS API Impl branch in the target container jsApiImplsBranches array', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addPackageToContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/org/repo.git#master'),
        'jsApiImplsBranches',
      );
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).updatePackageInContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/org/repo.git#dev'),
        'jsApiImplsBranches',
      );
      const jsApiImplsBranchesArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.jsApiImplsBranches',
      )[0];
      expect(
        jsApiImplsBranchesArr.includes('https://github.com/org/repo.git#dev'),
      ).true;
    });
  });

  describe('removePackageFromContainer [MiniApp branch]', () => {
    it('should throw if the MiniApp does not exist in the miniAppsBranches array', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addPackageToContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/org/repo.git#master'),
        'miniAppsBranches',
      );
      assert(
        rejects(
          api.removePackageFromContainer(
            AppVersionDescriptor.fromString('test:android:17.7.0'),
            PackagePath.fromString('https://github.com/foo/foo.git'),
            'miniAppsBranches',
          ),
        ),
      );
    });

    it('should remove the MiniApp branch from the target container miniAppsBranches array [branch specified]', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addPackageToContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/org/repo.git#master'),
        'miniAppsBranches',
      );
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).removePackageFromContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/org/repo.git#master'),
        'miniAppsBranches',
      );
      const miniAppsArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.miniAppsBranches',
      )[0];
      expect(miniAppsArr).empty;
    });

    it('should remove the MiniApp branch from the target container miniAppsBranches array [branch not specified]', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addPackageToContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/org/repo.git#master'),
        'miniAppsBranches',
      );
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).removePackageFromContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/org/repo.git'),
        'miniAppsBranches',
      );
      const miniAppsArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.miniAppsBranches',
      )[0];
      expect(miniAppsArr).empty;
    });
  });

  describe('removePackageFromContainer [JS API Implementation branch]', () => {
    it('should throw if the JS API Impl does not exist in the jsApiImplsBranches array', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addPackageToContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/org/repo.git#master'),
        'jsApiImplsBranches',
      );
      assert(
        rejects(
          api.removePackageFromContainer(
            AppVersionDescriptor.fromString('test:android:17.7.0'),
            PackagePath.fromString('https://github.com/foo/foo.git'),
            'jsApiImplsBranches',
          ),
        ),
      );
    });

    it('should remove the JS API Impl branch from the target container jsApiImplsBranches array [branch specified]', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addPackageToContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/org/repo.git#master'),
        'jsApiImplsBranches',
      );
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).removePackageFromContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/org/repo.git#master'),
        'jsApiImplsBranches',
      );
      const jsApiImplBranchesArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.jsApiImplsBranches',
      )[0];
      expect(jsApiImplBranchesArr).empty;
    });

    it('should remove the JS API Impl branch from the target container miniAppsBranches array [branch not specified]', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).addPackageToContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/org/repo.git#master'),
        'jsApiImplsBranches',
      );
      await cauldronApi({
        cauldronDocument: tmpFixture,
      }).removePackageFromContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/org/repo.git'),
        'jsApiImplsBranches',
      );
      const jsApiImplBranchesArr = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")].container.jsApiImplsBranches',
      )[0];
      expect(jsApiImplBranchesArr).empty;
    });
  });

  describe('hasJsPackageBranchInContainer [JS API Implementation branch]', () => {
    it('should return false if there is not git branch for the js api impl', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      const result = await api.hasJsPackageBranchInContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/org/repo.git#master'),
        'jsApiImplsBranches',
      );
      expect(result).false;
    });

    it('should return true if there is a git branch for the js api impl', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const api = cauldronApi({ cauldronDocument: tmpFixture });
      await api.addPackageToContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/org/repo.git#master'),
        'jsApiImplsBranches',
      );
      const result = await api.hasJsPackageBranchInContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
        PackagePath.fromString('https://github.com/org/repo.git#master'),
        'jsApiImplsBranches',
      );
      expect(result).true;
    });
  });

  describe('getConfigFilePath', () => {
    it('should return default config path if no descriptor is provided', () => {
      const cauldron = cauldronApi();
      const filePath = cauldron.getConfigFilePath();
      expect(filePath).eql('config/default.json');
    });

    it('should return native application config path', () => {
      const cauldron = cauldronApi();
      const descriptor = AppNameDescriptor.fromString('test');
      const filePath = cauldron.getConfigFilePath(descriptor);
      expect(filePath).eql('config/test.json');
    });

    it('should return native application platform config path', () => {
      const cauldron = cauldronApi();
      const descriptor = AppPlatformDescriptor.fromString('test:android');
      const filePath = cauldron.getConfigFilePath(descriptor);
      expect(filePath).eql('config/test-android.json');
    });

    it('should return native application version config path', () => {
      const cauldron = cauldronApi();
      const descriptor = AppVersionDescriptor.fromString('test:android:19.0.0');
      const filePath = cauldron.getConfigFilePath(descriptor);
      expect(filePath).eql('config/test-android-19.0.0.json');
    });
  });

  describe('emptyContainer', () => {
    it('should remove all MiniApps from Container of target native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const cauldron = cauldronApi({ cauldronDocument: tmpFixture });
      await cauldron.emptyContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
      );
      const version = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]',
      )[0];
      expect(version.container.miniApps).empty;
    });

    it('should remove all JS API Implementations from Container of target native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const cauldron = cauldronApi({ cauldronDocument: tmpFixture });
      await cauldron.emptyContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
      );
      const version = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]',
      )[0];
      expect(version.container.jsApiImpls).empty;
    });

    it('should remove all native dependencies from Container of target native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const cauldron = cauldronApi({ cauldronDocument: tmpFixture });
      await cauldron.emptyContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
      );
      const version = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]',
      )[0];
      expect(version.container.nativeDeps).empty;
    });

    it('should remove the Container yarn lock of target native application version', async () => {
      const tmpFixture = JSON.parse(JSON.stringify(fixtures.defaultCauldron));
      const cauldron = cauldronApi({ cauldronDocument: tmpFixture });
      await cauldron.emptyContainer(
        AppVersionDescriptor.fromString('test:android:17.7.0'),
      );
      const version = jp.query(
        tmpFixture,
        '$.nativeApps[?(@.name=="test")].platforms[?(@.name=="android")].versions[?(@.name=="17.7.0")]',
      )[0];
      expect(version.yarnLocks.container).undefined;
    });
  });
});
