{ pkgs, ... }:
pkgs.mkShellNoCC {
  packages = with pkgs; [
    forgejo-runner
    forgejo-cli
    bun
    biome
  ];

  shellHook = ''
    export BIOME_BINARY="${pkgs.biome}/bin/biome"
  '';
}
