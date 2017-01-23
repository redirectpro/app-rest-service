export S3_FILE_PATH=app-rest-service/`date +"%Y-%m"`
export S3_FILE_NAME=${CIRCLE_SHA1:0:7}.zip
export EB_VERSION=$CIRCLE_BRANCH-${CIRCLE_SHA1:0:7}
sed -ie 's/LOCAL/'${CIRCLE_SHA1:0:7}'/g' package.json
zip -r -9 --exclude=node_modules/* $S3_FILE_NAME *
aws s3 cp $S3_FILE_NAME s3://redirectpro-eb-$CIRCLE_BRANCH/$S3_FILE_PATH/
aws elasticbeanstalk create-application-version --application-name redirectpro \
	--version-label $EB_VERSION \
	--source-bundle S3Bucket="redirectpro-eb-$CIRCLE_BRANCH",S3Key="$S3_FILE_PATH/$S3_FILE_NAME"
aws elasticbeanstalk update-environment \
	--environment-name app-rest-service-$CIRCLE_BRANCH --version-label $EB_VERSION
