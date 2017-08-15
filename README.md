# The VDB Bench project

## Summary

This is the official git repository for the VDB Bench project.

VDB Bench is an open source visual tool that enables rapid, model-driven definition, integration, management and testing of data services without programming. The VDB Bench project contains development of the Data Service Builder (DSB) web interface.

For more information on Data Service Builder, visit the Teiid Designer project's website at [http://www.jboss.org/teiiddesigner/](http://www.jboss.org/teiiddesigner/)
or follow us on our [blog](http://teiid.blogspot.com/) or on [Twitter](https://twitter.com/teiiddesigner). Or hop into our [IRC chat room](http://www.jboss.org/teiiddesigner/chat)
and talk our community of contributors and users.

## Get the code

The easiest way to get started with the code is to [create your own fork](http://help.github.com/forking/) of this repository, and then clone your fork:

	$ git clone git@github.com:<you>/vdb-bench.git
	$ cd vdb-bench
	$ git remote add upstream git://github.com/Teiid-Designer/vdb-bench.git
	
At any time, you can pull changes from the upstream and merge them onto your master:

	$ git checkout master               # switches to the 'master' branch
	$ git pull upstream master          # fetches all 'upstream' changes and merges 'upstream/master' onto your 'master' branch
	$ git push origin                   # pushes all the updates to your fork, which should be in-sync with 'upstream'

The general idea is to keep your 'master' branch in-sync with the 'upstream/master'.

## Build the Code

- Install JDK 1.8
- Install maven 3 - http://maven.apache.org/download.html
- You will need to first build the komodo project.  See the [Komodo Project](https://github.com/Teiid-Designer/komodo) for build information.
- Then to build the vdb-bench code, cd into your vdb-bench local repo. Build using maven:

~~~
$ cd vdb-bench                         # switches to the 'master' branch
$ mvn clean install                    # build the code (you can add '-s' to skip unit tests)
~~~

After a successful build, the generated ear for DSB can be found at /vdb-bench-ear/target/ds-builder-archive.ear in your local repo.  The ds-builder-archive.ear can be placed in the deployments folder of your teiid server instance.

## Try out Data Service Builder (DSB)

If you want to try out __DSB__,  please see our [Getting Started Documentation](https://developer.jboss.org/wiki/GettingStartedWithDataServicesBuilder) to get started.

## Contribute fixes and features

vdb-builder is open source, and we welcome anybody that wants to participate and contribute!

If you want to fix a bug or make any changes, please log an issue in the [Teiid Tools JIRA](https://issues.jboss.org/browse/TEIIDTOOLS) describing the bug or new feature. Then we highly recommend making the changes on a topic branch named with the JIRA issue number. For example, this command creates a branch for the TEIIDTOOLS-1234 issue:

	$ git checkout -b teiidtools-1234

After you're happy with your changes and a full build (with unit tests) runs successfully, commit your changes on your topic branch
(using [really good comments](http://community.jboss.org/wiki/TeiidDesignerDevelopmentGuidelines#Commits)). Then it's time to check for
and pull any recent changes that were made in the official repository:

	$ git checkout master               # switches to the 'master' branch
	$ git pull upstream master          # fetches all 'upstream' changes and merges 'upstream/master' onto your 'master' branch
	$ git checkout teiidtools-1234      # switches to your topic branch
	$ git rebase master                 # reapplies your changes on top of the latest in master
	                                      (i.e., the latest from master will be the new base for your changes)

If the pull grabbed a lot of changes, you should rerun your build to make sure your changes are still good.
You can then either [create patches](http://progit.org/book/ch5-2.html) (one file per commit, saved in `~/teiidtools-1234`) with 

	$ git format-patch -M -o ~/teiidtools-1234 orgin/master

and upload them to the JIRA issue, or you can push your topic branch and its changes into your public fork repository

	$ git push origin teiidtools-1234         # pushes your topic branch into your public fork of vdb-bench

and [generate a pull-request](http://help.github.com/pull-requests/) for your changes. 

We prefer pull-requests, because we can review the proposed changes, comment on them,
discuss them with you, and likely merge the changes right into the official repository.

