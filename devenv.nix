{ pkgs, lib, config, inputs, ... }:

{

  # https://devenv.sh/packages/
  packages = [ pkgs.git pkgs.jq ];

  languages.javascript.enable = true;

  scripts.watch.exec = ''
    npm run watch
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
    VERSION=$(get-version)

    sed -i "s/HA_MAP_CARD_VERSION/$VERSION/" dist/map-card.js
    echo $VERSION
  '';

  enterShell = ''
    npm install
  '';
  

}
