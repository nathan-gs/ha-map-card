{ pkgs, lib, config, inputs, ... }:

{

  # https://devenv.sh/packages/
  packages = [ pkgs.git pkgs.jq ];

  languages.javascript.enable = true;

  scripts.watch.exec = ''
    npm run watch
  '';

  scripts.copy-to-ha.exec = ''
    npm run build
    sudo cp dist/map-card.js /var/lib/hass/www
  '';


  scripts.get-version.exec = ''
    jq -r '.version' package.json
  '';

  scripts.release-github.exec = ''
    npm run build
    VERSION=$(get-version)

    sed -i "s/HA_MAP_CARD_VERSION/$VERSION/" dist/map-card.js
    echo $VERSION
  '';

  scripts.release.exec = ''
    devenv test
    npm run build
    outstanding_changes=$(git status --porcelain=v1 2>/dev/null | wc -l)
    if [ $outstanding_changes -gt 0 ];
    then
      echo Aborting, uncommitted changes.
      git status
      exit 1
    fi
    VERSION=$(get-version)

    sed -i "s/HA_MAP_CARD_VERSION/$VERSION/" dist/map-card.js
    echo $VERSION

    git tag v$VERSION
  '';

  enterShell = ''
    npm install
  '';

  enterTest = ''
    npm run build
    npm run lint
  '';
  

}
