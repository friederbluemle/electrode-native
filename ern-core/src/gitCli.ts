import gitP, { SimpleGit } from 'simple-git/promise';
import log from './log'
import { LogLevel } from './coloredLog'

export function gitCli(workingDir?: string) {
  const simpleGitInstance: SimpleGit = gitP(workingDir)
  simpleGitInstance.silent(log.level !== LogLevel.Trace)
  return simpleGitInstance
}
