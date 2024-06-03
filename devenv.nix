{ pkgs, lib, config, inputs, ... }:

{

  # https://devenv.sh/packages/
  packages = [ pkgs.git ];

  languages.javascript.enable = true;
  
}
