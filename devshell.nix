{pkgs, ...}:
pkgs.mkShellNoCC {
  packages = with pkgs; [
    forgejo-runner
    forgejo-cli
    pnpm
    nodejs
    biome
  ];

  shellHook = ''
    export BIOME_BINARY="${pkgs.biome}/bin/biome"
  '';
}
